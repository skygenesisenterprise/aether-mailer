#!/usr/bin/env bash
#
# Regression tests for install.sh.
#
# There is no real Docker/Dokploy host in CI, so `docker`, `ss`, `curl`, `id`,
# `ip` and `openssl` are mocked. The tests assert on exit codes, human output,
# and — crucially — on which commands were executed or deliberately *not*
# executed (see the per-case command log). install.sh is always invoked through
# `sh` so POSIX (`dash`) compatibility is exercised too.
#
# Usage: scripts/test-install.sh
#        KEEP_WORK=1 scripts/test-install.sh   (keep the temp mocks/state for debugging)
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL="$ROOT/install.sh"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/notploy-install-test.XXXXXX")"
MOCKS="$WORK/bin"
CASE_DIR="$WORK/case"
STATE="$CASE_DIR/state"
LOG="$STATE/call.log"
trap '[ -n "${KEEP_WORK:-}" ] || rm -rf "$WORK"' EXIT
[ -n "${KEEP_WORK:-}" ] && printf 'WORK=%s\n' "$WORK" >&2

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); printf '  ok   %s\n' "$1"; }
fail() { FAIL=$((FAIL + 1)); printf '  FAIL %s\n' "$1"; }

assert_rc() {
    if [ "$1" = "$2" ]; then pass "$3"; else fail "$3 (expected rc=$2, got $1)"; fi
}
assert_contains() {
    case "$1" in *"$2"*) pass "$3" ;; *) fail "$3 (missing '$2')" ;; esac
}
assert_not_contains() {
    case "$1" in *"$2"*) fail "$3 (unexpected '$2')" ;; *) pass "$3" ;; esac
}
assert_logged() {
    if grep -qF -- "$1" "$LOG" 2>/dev/null; then pass "$2"; else fail "$2 (not in command log)"; fi
}
assert_not_logged() {
    if grep -qF -- "$1" "$LOG" 2>/dev/null; then fail "$2 (unexpected command in log)"; else pass "$2"; fi
}
assert_file_exists() {
    if [ -e "$1" ]; then pass "$2"; else fail "$2 ($1 missing)"; fi
}
assert_file_absent() {
    if [ -e "$1" ]; then fail "$2 ($1 unexpectedly present)"; else pass "$2"; fi
}
assert_eq() {
    if [ "$1" = "$2" ]; then pass "$3"; else fail "$3 (expected '$2', got '$1')"; fi
}

# --------------------------------------------------------------------------
# Mock executables
# --------------------------------------------------------------------------
mkdir -p "$MOCKS"

cat > "$MOCKS/docker" <<'MOCK'
#!/bin/sh
STATE="${MOCK_STATE:?MOCK_STATE unset}"
LOG="$STATE/call.log"
printf 'docker %s\n' "$*" >> "$LOG"
state() { cat "$STATE/$1" 2>/dev/null; }
is_fail() { [ "$(state "$1")" = "1" ]; }

get_flag() { # get_flag <--flag> <args...>
    want="$1"; shift
    prev=""
    for a in "$@"; do
        [ "$prev" = "$want" ] && { printf '%s' "$a"; return 0; }
        prev="$a"
    done
    return 0
}

emit_ps() {
    fmt="$1"; src="$2"
    [ -f "$src" ] || return 0
    while IFS='|' read -r id name image labels networks ports; do
        [ -n "$name" ] || continue
        case "$fmt" in
            *'{{.ID}}|{{.Names}}|{{.Image}}|{{.Labels}}'*) printf '%s|%s|%s|%s\n' "$id" "$name" "$image" "$labels" ;;
            *'{{.ID}}|{{.Names}}|{{.Networks}}|{{.Labels}}'*) printf '%s|%s|%s|%s\n' "$id" "$name" "$networks" "$labels" ;;
            *'{{.Names}}|{{.Networks}}|{{.Labels}}|{{.Image}}'*) printf '%s|%s|%s|%s\n' "$name" "$networks" "$labels" "$image" ;;
            *'{{.Names}}|{{.Networks}}|{{.Labels}}'*) printf '%s|%s|%s\n' "$name" "$networks" "$labels" ;;
            *'{{.Names}}|{{.Image}}|{{.Ports}}'*) printf '%s|%s|%s\n' "$name" "$image" "$ports" ;;
            *'{{.Names}}|{{.Image}}'*) printf '%s|%s\n' "$name" "$image" ;;
            *'{{.ID}}|{{.Names}}|{{.Networks}}|{{.Image}}'*) printf '%s|%s|%s|%s\n' "$id" "$name" "$networks" "$image" ;;
            *'{{.ID}}|{{.Names}}'*) printf '%s|%s\n' "$id" "$name" ;;
            *'{{.Names}}|{{.Ports}}'*) printf '%s|%s\n' "$name" "$ports" ;;
            *'{{.Names}}'*) printf '%s\n' "$name" ;;
            *'{{.Labels}}'*) printf '%s\n' "$labels" ;;
            *) printf '%s\n' "$name" ;;
        esac
    done < "$src"
}

cmd="$1"; shift || true
case "$cmd" in
    info)
        is_fail docker_info_fail && exit 1
        case "$*" in
            *LocalNodeState*) state swarm_state ;;
            *ControlAvailable*) state swarm_control ;;
            *) : ;;
        esac
        ;;
    ps)
        all=0; quiet=0; filter=""
        for a in "$@"; do
            [ "$a" = "-a" ] || [ "$a" = "--all" ] && all=1
            [ "$a" = "-q" ] || [ "$a" = "--quiet" ] && quiet=1
        done
        filter="$(get_flag --filter "$@")"
        fmt="$(get_flag --format "$@")"
        for a in "$@"; do
            case "$a" in --format=*) fmt="${a#--format=}" ;; esac
            case "$a" in --filter=*) filter="${a#--filter=}" ;; esac
        done
        if [ "$quiet" = "1" ]; then
            # Only the Dokploy application container/task is of interest here.
            while IFS='|' read -r id name image labels networks ports; do
                [ -n "$name" ] || continue
                case "$name" in
                    dokploy|dokploy.[0-9]*) printf '%s\n' "$id" ;;
                esac
            done < "$STATE/containers"
            exit 0
        fi
        src="$STATE/containers"
        if [ "$all" = "1" ]; then
            case "$filter" in
                *status=exited*|*status=created*) src="$STATE/exited" ;;
            esac
        fi
        emit_ps "$fmt" "$src"
        ;;
    service)
        sub="$1"; shift || true
        case "$sub" in
            ls)
                while IFS='|' read -r name image; do
                    [ -n "$name" ] || continue
                    case "$*" in
                        *'{{.Name}}|{{.Image}}'*) printf '%s|%s\n' "$name" "$image" ;;
                        *) printf '%s\n' "$name" ;;
                    esac
                done < "$STATE/services"
                ;;
            inspect)
                name="$1"; shift || true
                awk -F'|' -v n="$name" '$1==n{f=1} END{exit f?0:1}' "$STATE/services" || exit 1
                case "$*" in
                    *UpdateStatus.State*) state update_state ;;
                    *Spec.Mode.Replicated.Replicas*) state desired_replicas ;;
                    *) printf '{}' ;;
                esac
                ;;
            create)
                is_fail fail_service && { echo "mock: service create failed" >&2; exit 1; }
                name="$(get_flag --name "$@")"
                echo "$name" >> "$STATE/services"
                ;;
            update)
                if is_fail fail_service_update; then exit 1; fi
                ;;
            ps)
                n="$(state service_ps_running)"
                [ -n "$n" ] || n=1
                i=0
                while [ "$i" -lt "$n" ]; do echo "Running 1 second ago"; i=$((i + 1)); done
                ;;
            *) : ;;
        esac
        ;;
    network)
        sub="$1"; shift || true
        case "$sub" in
            ls)
                while IFS='|' read -r name driver; do
                    [ -n "$name" ] && printf '%s\n' "$name"
                done < "$STATE/networks"
                ;;
            inspect)
                name="$1"; shift || true
                driver="$(awk -F'|' -v n="$name" '$1==n{print $2}' "$STATE/networks")"
                [ -n "$driver" ] || exit 1
                case "$*" in *Driver*) printf '%s' "$driver" ;; *) printf '{}' ;; esac
                ;;
            create)
                is_fail fail_network && { echo "mock: network create failed" >&2; exit 1; }
                name=""
                for a in "$@"; do case "$a" in --*) : ;; *) name="$a" ;; esac; done
                echo "$name|overlay" >> "$STATE/networks"
                ;;
            rm) : ;;
            *) : ;;
        esac
        ;;
    secret)
        sub="$1"; shift || true
        case "$sub" in
            inspect) grep -qx "$1" "$STATE/secrets" 2>/dev/null ;;
            ls) cat "$STATE/secrets" 2>/dev/null ;;
            create)
                if is_fail fail_secret; then cat >/dev/null; echo "mock: secret create failed" >&2; exit 1; fi
                sval="$(cat)"
                printf '%s|%s\n' "$1" "$sval" >> "$STATE/secret_values"
                echo "$1" >> "$STATE/secrets"
                ;;
            *) : ;;
        esac
        ;;
    volume)
        sub="$1"; shift || true
        case "$sub" in
            ls) cat "$STATE/volumes" 2>/dev/null ;;
            inspect) grep -qx "$1" "$STATE/volumes" 2>/dev/null ;;
            create) echo "$1" >> "$STATE/volumes" ;;
            *) : ;;
        esac
        ;;
    image)
        sub="$1"; shift || true
        case "$sub" in
            inspect) grep -qx "$1" "$STATE/images" 2>/dev/null ;;
            ls) cat "$STATE/images" ;;
            *) : ;;
        esac
        ;;
    pull)
        is_fail fail_pull && { echo "mock: pull failed" >&2; exit 1; }
        echo "$1" >> "$STATE/images"
        ;;
    run)
        is_fail fail_run && { echo "mock: run failed" >&2; exit 1; }
        echo "$(get_flag --name "$@")" >> "$STATE/run_containers"
        ;;
    rm)
        # Removing a container releases the ports it had published.
        : > "$STATE/listen"
        ;;
    inspect)
        grep -qx "$1" "$STATE/run_containers" 2>/dev/null
        ;;
    node)
        case "$1" in ls) cat "$STATE/nodes" ;; esac
        ;;
    exec)
        shift  # container id
        case "$*" in
            *pg_dump*) cat "$STATE/dump" 2>/dev/null ;;
            *'cat /run/secrets/dokploy_auth_secret'*) cat "$STATE/dokploy_auth_secret" 2>/dev/null ;;
            *) : ;;
        esac
        ;;
    swarm)
        case "$1" in
            init) if is_fail fail_swarm_init; then exit 1; fi ;;
            *) : ;;
        esac
        ;;
    version|--version) printf 'Docker version 28.5.2' ;;
    *) : ;;
esac
MOCK

cat > "$MOCKS/ss" <<'MOCK'
#!/bin/sh
cat "${MOCK_STATE:?}/listen" 2>/dev/null
MOCK

cat > "$MOCKS/curl" <<'MOCK'
#!/bin/sh
STATE="${MOCK_STATE:?}"
case "$*" in
    *'%{url_effective}'*)
        cat "$STATE/release_url" 2>/dev/null
        ;;
    *ifconfig.io*|*icanhazip*|*ipecho*)
        cat "$STATE/public_ip" 2>/dev/null
        ;;
    *) : ;;
esac
MOCK

cat > "$MOCKS/id" <<'MOCK'
#!/bin/sh
case "$1" in
    -u) cat "${MOCK_STATE:?}/uid" 2>/dev/null || echo 0 ;;
    -un) cat "${MOCK_STATE:?}/user" 2>/dev/null || echo root ;;
    *) echo "uid=0(root) gid=0(root)" ;;
esac
MOCK

cat > "$MOCKS/sudo" <<'MOCK'
#!/bin/sh
# Mimics passwordless sudo: `sudo -n true` succeeds only when the state says so,
# and every other invocation is logged (so tests can assert on `sudo <cmd>`) and
# then executed in place.
STATE="${MOCK_STATE:?MOCK_STATE unset}"
if [ "$1" = "-n" ]; then
    [ "$(cat "$STATE/sudo_passwordless" 2>/dev/null)" = "1" ] && exit 0
    exit 1
fi
printf 'sudo %s\n' "$*" >> "$STATE/call.log"
exec "$@"
MOCK

cat > "$MOCKS/ip" <<'MOCK'
#!/bin/sh
if [ "$1" = "-o" ]; then
    echo "2: eth0    inet 192.168.1.10/24 brd 192.168.1.255 scope global eth0"
fi
MOCK

cat > "$MOCKS/openssl" <<'MOCK'
#!/bin/sh
STATE="${MOCK_STATE:?}"
out=""
prev=""
for a in "$@"; do
    [ "$prev" = "-out" ] && out="$a"
    prev="$a"
done
case "$1" in
    genpkey) [ -n "$out" ] && : > "$out" ;;
    req) [ -n "$out" ] && printf 'DUMMY CERT\n' > "$out" ;;
    x509)
        case "$*" in
            *-checkend*) exit 0 ;;
            *-pubkey*) printf 'PUBKEY' ;;
            *) [ -n "$out" ] && printf 'DUMMY CERT\n' > "$out" ;;
        esac
        ;;
    pkey)
        case "$*" in *-pubout*) printf 'PUBKEY-DER' ;; esac
        ;;
    verify) exit 0 ;;
    dgst) printf '(stdin)= deadbeef' ;;
    rand) printf 'rand0mS3cretValueForTesting1234' ;;
    *) : ;;
esac
MOCK

chmod +x "$MOCKS"/*

# --------------------------------------------------------------------------
# Per-case state
# --------------------------------------------------------------------------
init_state() {
    rm -rf "$CASE_DIR"
    mkdir -p "$STATE"
    printf 'inactive\n' > "$STATE/swarm_state"
    printf 'true\n' > "$STATE/swarm_control"
    printf '0\n' > "$STATE/docker_info_fail"
    printf '0\n' > "$STATE/uid"
    printf 'root\n' > "$STATE/user"
    printf '1\n' > "$STATE/sudo_passwordless"
    : > "$STATE/containers"
    : > "$STATE/exited"
    : > "$STATE/services"
    : > "$STATE/networks"
    : > "$STATE/secrets"
    : > "$STATE/volumes"
    : > "$STATE/nodes"
    printf 'traefik:v3.6.25\n' > "$STATE/images"
    : > "$STATE/run_containers"
    printf '0\n' > "$STATE/fail_secret"
    printf '0\n' > "$STATE/fail_network"
    printf '0\n' > "$STATE/fail_service"
    printf '0\n' > "$STATE/fail_service_update"
    printf '0\n' > "$STATE/fail_pull"
    printf '0\n' > "$STATE/fail_run"
    printf '0\n' > "$STATE/fail_swarm_init"
    printf '\n' > "$STATE/update_state"
    printf '1\n' > "$STATE/desired_replicas"
    printf '1\n' > "$STATE/service_ps_running"
    : > "$STATE/listen"
    : > "$STATE/dump"
    : > "$STATE/secret_values"
    : > "$STATE/dokploy_auth_secret"
    printf 'https://github.com/skygenesisenterprise/notploy/releases/tag/v1.2.3\n' > "$STATE/release_url"
    printf '203.0.113.10\n' > "$STATE/public_ip"
    : > "$LOG"
}

run_install() {
    PATH="$MOCKS:$PATH" \
    MOCK_STATE="$STATE" \
    NOTPLOY_CONFIG_PATH="$CASE_DIR/etc/notploy" \
    sh "$INSTALL" "$@"
}

run_install_capture() {
    OUT="$(run_install "$@" 2>&1)"
    RC=$?
}

# ==========================================================================
# 1. Fresh host with prerequisites satisfied
# ==========================================================================
echo "1. Fresh host with prerequisites satisfied"
init_state
run_install_capture
assert_rc "$RC" 0 "install succeeds on a virgin host"
assert_contains "$OUT" "is installed and the service is running" "reports success after convergence"
assert_logged "docker swarm init" "initializes a new Swarm"
assert_not_logged "docker swarm leave" "never leaves a Swarm on a fresh host"
assert_logged "docker network create" "creates the overlay network"
assert_logged "docker service create" "creates services"
assert_file_exists "$CASE_DIR/etc/notploy/identity/instance.key" "bootstraps the identity"
assert_contains "$OUT" "Running as root" "detects root without needing sudo"
assert_not_logged "sudo docker" "does not invoke sudo when already root"

# ==========================================================================
# 2. Notploy already installed
# ==========================================================================
echo "2. Notploy already installed"
init_state
printf 'notploy\nnotploy-postgres\n' > "$STATE/services"
run_install_capture
assert_rc "$RC" 1 "refuses a fresh install over an existing Notploy"
assert_contains "$OUT" "existing Notploy installation" "explains the existing install"
assert_not_logged "docker swarm init" "does not re-initialize the Swarm"

# ==========================================================================
# 3. Existing Notploy network/secrets but no service (partial install)
# ==========================================================================
echo "3. Existing network and secrets are reused"
init_state
printf 'notploy-network|overlay\n' > "$STATE/networks"
printf 'notploy_postgres_password\nnotploy_auth_secret\n' > "$STATE/secrets"
run_install_capture
assert_rc "$RC" 0 "completes a partial install"
assert_contains "$OUT" "Reusing the existing 'notploy-network'" "reuses the overlay network"
assert_contains "$OUT" "already exists; reusing" "reuses existing secrets"
assert_not_logged "docker network rm" "never removes an existing network"

# ==========================================================================
# 4. Active Swarm not owned by Notploy
# ==========================================================================
echo "4. Active third-party Swarm is preserved"
init_state
printf 'active\n' > "$STATE/swarm_state"
run_install_capture
assert_rc "$RC" 1 "refuses to install over a foreign Swarm"
assert_contains "$OUT" "refuses to leave or modify" "explains the refusal"
assert_not_logged "docker swarm leave" "never leaves the foreign Swarm"
assert_not_logged "docker swarm init" "does not touch the foreign Swarm"
assert_not_logged "docker network create" "does not mutate the foreign host"

# ==========================================================================
# 5. Dokploy using Compose, --fresh, exposed ports busy
# ==========================================================================
echo "5. Dokploy Compose with busy ports refuses a fresh install"
init_state
printf 'abc123|dokploy-app|app:1||dokploy-network|80,443\n' > "$STATE/containers"
printf 'LISTEN 0 128 0.0.0.0:80 0.0.0.0:*\n' > "$STATE/listen"
run_install_capture --fresh
assert_rc "$RC" 1 "refuses when a third-party service holds port 80"
assert_contains "$OUT" "port 80 is already in use" "identifies the busy port"
assert_not_logged "docker swarm init" "does not mutate the host"

# ==========================================================================
# 6. Dokploy using Swarm, --fresh
# ==========================================================================
echo "6. Dokploy Swarm refuses a fresh install"
init_state
printf 'active\n' > "$STATE/swarm_state"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' > "$STATE/containers"
printf 'dokploy-svc|dokploy/dokploy:v0.1.0\n' > "$STATE/services"
run_install_capture --fresh
assert_rc "$RC" 1 "refuses --fresh over a Dokploy Swarm"
assert_not_logged "docker swarm leave" "never leaves the Dokploy Swarm"

# ==========================================================================
# 7. Required port busy by a third party
# ==========================================================================
echo "7. Required port busy by a third party"
init_state
printf 'LISTEN 0 128 0.0.0.0:3000 0.0.0.0:*\n' > "$STATE/listen"
run_install_capture
assert_rc "$RC" 1 "refuses when port 3000 is taken"
assert_contains "$OUT" "port 3000 is already in use" "names the busy port"
assert_not_logged "docker swarm init" "does not mutate the host"

# ==========================================================================
# 8. Docker daemon unavailable
# ==========================================================================
echo "8. Docker daemon unavailable"
init_state
printf '1\n' > "$STATE/docker_info_fail"
run_install_capture
assert_rc "$RC" 1 "fails when the Docker daemon is unreachable"
assert_contains "$OUT" "Docker daemon is not reachable" "explains the Docker failure"

# ==========================================================================
# 9. Required secret creation fails
# ==========================================================================
echo "9. Required secret creation fails"
init_state
printf '1\n' > "$STATE/fail_secret"
run_install_capture
assert_rc "$RC" 1 "fails when a required secret cannot be created"
assert_contains "$OUT" "failed to create the required Docker secret" "explains the secret failure"
assert_not_logged "docker service create --name notploy " "does not start services after a secret failure"

# ==========================================================================
# 10. Image pull fails during update
# ==========================================================================
echo "10. Image pull fails during update"
init_state
printf 'notploy\nnotploy-postgres\n' > "$STATE/services"
printf '1\n' > "$STATE/fail_pull"
NOTPLOY_VERSION=v2.0.0 run_install_capture update
assert_rc "$RC" 1 "fails when the update image cannot be pulled"
assert_contains "$OUT" "could not pull" "explains the pull failure"
assert_not_logged "docker service update" "does not update the service before a successful pull"

# ==========================================================================
# 11. Service fails to converge after update
# ==========================================================================
echo "11. Service fails to converge after update"
init_state
printf 'notploy\nnotploy-postgres\n' > "$STATE/services"
printf 'rollback_started\n' > "$STATE/update_state"
NOTPLOY_VERSION=v2.0.0 run_install_capture update
assert_rc "$RC" 1 "fails when the update does not converge"
assert_contains "$OUT" "rollback notploy" "suggests an explicit rollback"
assert_contains "$OUT" "does not undo database schema migrations" "documents the rollback limitation"

# ==========================================================================
# 12. Successful update
# ==========================================================================
echo "12. Successful update"
init_state
printf 'notploy\nnotploy-postgres\n' > "$STATE/services"
NOTPLOY_VERSION=v2.0.0 run_install_capture update
assert_rc "$RC" 0 "update succeeds when the service converges"
assert_logged "docker service update" "updates the service"
assert_contains "$OUT" "has been updated to version: v2.0.0" "reports the updated version"

# ==========================================================================
# 13. Existing coherent identity is preserved
# ==========================================================================
echo "13. Coherent identity is preserved"
init_state
mkdir -p "$CASE_DIR/etc/notploy/identity"
printf 'EXISTING-KEY' > "$CASE_DIR/etc/notploy/identity/instance.key"
printf 'EXISTING-CRT' > "$CASE_DIR/etc/notploy/identity/instance.crt"
printf 'EXISTING-CA' > "$CASE_DIR/etc/notploy/identity/ca.crt"
run_install_capture
assert_rc "$RC" 0 "install proceeds with a coherent identity"
assert_contains "$OUT" "coherent at" "keeps the existing identity"
assert_eq "$(cat "$CASE_DIR/etc/notploy/identity/instance.key")" "EXISTING-KEY" "does not overwrite the private key"

# ==========================================================================
# 14. Incoherent identity is not silently regenerated
# ==========================================================================
echo "14. Incoherent identity"
init_state
mkdir -p "$CASE_DIR/etc/notploy/identity"
printf 'PARTIAL' > "$CASE_DIR/etc/notploy/identity/instance.key"
run_install_capture
assert_rc "$RC" 1 "fails on an incomplete identity"
assert_contains "$OUT" "incomplete or incoherent" "explains the identity problem"
assert_eq "$(cat "$CASE_DIR/etc/notploy/identity/instance.key")" "PARTIAL" "does not overwrite the partial key"

# ==========================================================================
# 15. --dry-run is non-destructive
# ==========================================================================
echo "15. --dry-run is non-destructive"
init_state
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' > "$STATE/containers"
run_install_capture --dry-run
assert_rc "$RC" 0 "dry-run exits cleanly"
assert_contains "$OUT" "Dry-run: the assessment report was not written" "does not persist the report"
assert_file_absent "$CASE_DIR/etc/notploy" "does not create the config directory"
assert_not_logged "docker swarm init" "does not mutate the host"

# ==========================================================================
# 16. --json emits machine-readable output only
# ==========================================================================
echo "16. --json"
init_state
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' > "$STATE/containers"
run_install_capture --json
assert_rc "$RC" 0 "json mode exits 0"
assert_contains "$OUT" '"detected": true' "reports Dokploy as detected"
assert_contains "$OUT" '"unattributed": 0' "reports unattributed resources"
case "$OUT" in
    \{*) pass "stdout starts with JSON" ;;
    *) fail "stdout starts with JSON (got: $OUT)" ;;
esac

# ==========================================================================
# 17. NOTPLOY_SOURCE_ONLY=1 is a library
# ==========================================================================
echo "17. NOTPLOY_SOURCE_ONLY=1"
init_state
OUT="$(PATH="$MOCKS:$PATH" MOCK_STATE="$STATE" NOTPLOY_CONFIG_PATH="$CASE_DIR/etc/notploy" \
    NOTPLOY_SOURCE_ONLY=1 sh -c '. "$1"; command -v bootstrap_identity && command -v install_notploy' _ "$INSTALL" 2>&1)"
RC=$?
assert_rc "$RC" 0 "sourcing the library defines the exported functions"
assert_not_logged "docker swarm init" "does not install when sourced"

# ==========================================================================
# 18. Unattributed containers are not advertised as migratable
# ==========================================================================
echo "18. Attribution honesty"
init_state
printf 'a1|dokploy-app|app:1||dokploy-network|\n' > "$STATE/containers"
printf 'b2|unrelated|img:1||bridge|\n' >> "$STATE/containers"
run_install_capture --json
assert_rc "$RC" 0 "json mode succeeds"
assert_contains "$OUT" '"applications": 1' "counts only attributed applications"
assert_contains "$OUT" '"unattributed": 1' "counts unattributed containers separately"

# ==========================================================================
# 19. --migrate performs the full Dokploy → Notploy migration
# ==========================================================================
echo "19. --migrate performs the full migration"
init_state
printf 'active\n' > "$STATE/swarm_state"
printf 'c1|dokploy-postgres|postgres:16||dokploy-network|\n' > "$STATE/containers"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' >> "$STATE/containers"
printf 'dokploy|dokploy/dokploy:v24.0.0\n' > "$STATE/services"
printf 'dokploy-network|overlay\n' > "$STATE/networks"
printf 'CREATE TABLE project (id text primary key);\n\INSERT INTO project VALUES (1);\n' > "$STATE/dump"
mkdir -p "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic"
printf 'http:\n  routers:\n' > "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic/example.yml"
NOTPLOY_DOKPLOY_CONFIG_PATH="$CASE_DIR/dokploy/etc/dokploy" run_install_capture --migrate
assert_rc "$RC" 0 "migration succeeds"
assert_contains "$OUT" "Migration complete" "reports migration success"
assert_contains "$OUT" "Database imported" "reports the DB dump/restore"
assert_logged "docker exec c1 pg_dump" "dumps the Dokploy database"
assert_logged "--no-owner" "drops ownership-dependent clauses from the dump"
assert_logged "--no-acl" "drops GRANTs that would abort the import"
assert_logged "docker service create --name notploy-postgres" "creates the Notploy Postgres service"
assert_logged "docker service rm dokploy" "stops Dokploy's management service"
assert_logged "docker network connect dokploy-network notploy-traefik" "joins the Dokploy network for routing"
assert_logged "docker service update --network-add dokploy-network" "attaches the Notploy service to the Dokploy network"
assert_not_logged "docker swarm leave" "never leaves the Swarm during migration"
assert_file_exists "$CASE_DIR/etc/notploy/traefik/dynamic/example.yml" "adopts the Dokploy config into Notploy"
backup_dir="$(echo "$CASE_DIR"/etc/notploy/backups/dokploy-* | awk '{print $1}')"
if [ -f "$backup_dir/database.sql" ] && [ -f "$backup_dir/config.tar.gz" ]; then
    pass "creates DB and config backups"
else
    fail "creates DB and config backups (missing in $backup_dir)"
fi

# ==========================================================================
# 20. Unrecognized infrastructure without ports in use still guarded
# ==========================================================================
echo "20. Foreign identity / unrecognized infra"
init_state
printf 'active-worker\n' > "$STATE/swarm_state"
run_install_capture
assert_rc "$RC" 1 "refuses to install on an unrecognized active worker"
assert_contains "$OUT" "refuses to leave or modify" "explains the refusal"
assert_not_logged "docker swarm leave" "does not leave the worker Swarm"

# ==========================================================================
# 21. Default install on a Dokploy host migrates automatically
# ==========================================================================
echo "21. Default install migrates a Dokploy host automatically"
init_state
printf 'active\n' > "$STATE/swarm_state"
printf 'c1|dokploy-postgres|postgres:16||dokploy-network|\n' > "$STATE/containers"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' >> "$STATE/containers"
printf 'dokploy|dokploy/dokploy:v24.0.0\n' > "$STATE/services"
printf 'dokploy-network|overlay\n' > "$STATE/networks"
printf 'CREATE TABLE project (id text primary key);\n' > "$STATE/dump"
mkdir -p "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic"
printf 'http:\n  routers:\n' > "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic/example.yml"
NOTPLOY_DOKPLOY_CONFIG_PATH="$CASE_DIR/dokploy/etc/dokploy" run_install_capture
assert_rc "$RC" 0 "a Dokploy host is not treated as a fresh host"
assert_contains "$OUT" "Migration complete" "migrates automatically without flags"
assert_logged "docker service rm dokploy" "stops Dokploy management services"
assert_not_logged "docker swarm leave" "never leaves the Swarm automatically"

# ==========================================================================
# 22. Incomplete Dokploy runtime fails closed
# ==========================================================================
echo "22. Incomplete Dokploy runtime fails closed"
init_state
printf 'active\n' > "$STATE/swarm_state"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' > "$STATE/containers"
printf 'dokploy-network|overlay\n' > "$STATE/networks"
NOTPLOY_DOKPLOY_CONFIG_PATH="$CASE_DIR/none/dokploy" run_install_capture --migrate
assert_rc "$RC" 1 "refuses to migrate an incomplete runtime"
assert_contains "$OUT" "No change was made to this host" "explains the refusal"
assert_not_logged "docker service create --name notploy " "does not deploy Notploy services"
assert_not_logged "docker service rm dokploy" "does not stop Dokploy services"

# ==========================================================================
# 23. Migration reclaims ports held by Dokploy instead of blocking
# ==========================================================================
echo "23. Migration reclaims Dokploy-held ports"
init_state
printf 'active\n' > "$STATE/swarm_state"
printf 'c1|dokploy-postgres|postgres:16||dokploy-network|\n' > "$STATE/containers"
printf 't1|dokploy-traefik|traefik:v3||dokploy-network|0.0.0.0:80->80/tcp\n' >> "$STATE/containers"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' >> "$STATE/containers"
printf 'dokploy|dokploy/dokploy:v24.0.0\n' > "$STATE/services"
printf 'dokploy-network|overlay\n' > "$STATE/networks"
printf 'CREATE TABLE project (id text primary key);\n' > "$STATE/dump"
printf 'LISTEN 0 128 0.0.0.0:80 0.0.0.0:*\n' > "$STATE/listen"
mkdir -p "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic"
printf 'http:\n  routers:\n' > "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic/example.yml"
NOTPLOY_DOKPLOY_CONFIG_PATH="$CASE_DIR/dokploy/etc/dokploy" run_install_capture --migrate
assert_rc "$RC" 0 "migration succeeds even when Dokploy holds port 80"
assert_contains "$OUT" "Migration complete" "reports migration success"
assert_contains "$OUT" "Reclaiming port 80" "explains the port reclaim"
assert_logged "docker rm -f dokploy-traefik" "reclaims the port from the Dokploy proxy"
assert_not_logged "port 80 is already in use" "does not block on a Dokploy-held port"

# ==========================================================================
# 24. Compose-based Dokploy (no Swarm yet) initializes one and migrates
# ==========================================================================
echo "24. Migration initializes Swarm on a Compose-based Dokploy host"
init_state
printf 'inactive\n' > "$STATE/swarm_state"
printf 'c1|dokploy-postgres|postgres:16||dokploy-network|\n' > "$STATE/containers"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' >> "$STATE/containers"
printf 'dokploy-network|bridge\n' > "$STATE/networks"
printf 'CREATE TABLE project (id text primary key);\n' > "$STATE/dump"
mkdir -p "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic"
printf 'http:\n  routers:\n' > "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic/example.yml"
NOTPLOY_DOKPLOY_CONFIG_PATH="$CASE_DIR/dokploy/etc/dokploy" run_install_capture --migrate
assert_rc "$RC" 0 "migrates a Compose-based Dokploy host"
assert_contains "$OUT" "No active Docker Swarm detected" "announces the Swarm initialization"
assert_logged "docker swarm init" "initializes the missing Swarm"
assert_contains "$OUT" "Migration complete" "completes the migration"
assert_not_logged "docker swarm leave" "never leaves the Swarm"

# ==========================================================================
# 25. Migration rewrites Dokploy absolute paths to the Notploy layout
# ==========================================================================
echo "25. Migration rewrites Dokploy paths for Notploy"
init_state
printf 'active\n' > "$STATE/swarm_state"
printf 'c1|dokploy-postgres|postgres:16||dokploy-network|\n' > "$STATE/containers"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' >> "$STATE/containers"
printf 'dokploy|dokploy/dokploy:v24.0.0\n' > "$STATE/services"
printf 'dokploy-network|overlay\n' > "$STATE/networks"
printf "CREATE TABLE certificate (certificatePath text);\nINSERT INTO certificate VALUES ('/etc/dokploy/certificates/abc');\n" > "$STATE/dump"
mkdir -p "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic"
printf 'provider:\n  file:\n    directory: /etc/dokploy/traefik/dynamic\n' > "$CASE_DIR/dokploy/etc/dokploy/traefik/traefik.yml"
printf '{}' > "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic/acme.json"
printf 'certificates: /etc/dokploy/certificates\n' > "$CASE_DIR/dokploy/etc/dokploy/dokploy.yml"
NOTPLOY_DOKPLOY_CONFIG_PATH="$CASE_DIR/dokploy/etc/dokploy" run_install_capture --migrate
assert_rc "$RC" 0 "migration succeeds with path rewriting"
backup_dir="$(echo "$CASE_DIR"/etc/notploy/backups/dokploy-* | awk '{print $1}')"
import_dump="$backup_dir/database-import.sql"
assert_file_exists "$import_dump" "writes a rewritten import dump"
if grep -q "/etc/notploy/certificates/abc" "$import_dump" 2>/dev/null; then
    pass "rewrites DB paths to /etc/notploy"
else
    fail "rewrites DB paths to /etc/notploy"
fi
assert_file_exists "$backup_dir/database.sql" "keeps the pristine Dokploy dump"
if grep -q "/etc/dokploy" "$CASE_DIR/etc/notploy/traefik/traefik.yml" 2>/dev/null; then
    fail "rewrites the adopted Traefik config paths"
else
    pass "rewrites the adopted Traefik config paths"
fi
if grep -q "/etc/notploy/certificates" "$CASE_DIR/etc/notploy/dokploy.yml" 2>/dev/null; then
    pass "rewrites every adopted config file, not just traefik.yml"
else
    fail "rewrites every adopted config file, not just traefik.yml"
fi
if grep -q "/etc/dokploy" "$backup_dir/database.sql" 2>/dev/null; then
    pass "leaves the pristine backup directory untouched"
else
    fail "leaves the pristine backup directory untouched"
fi
assert_eq "$(stat -c %a "$CASE_DIR/etc/notploy/traefik/dynamic/acme.json" 2>/dev/null)" "600" "secures acme.json"

# ==========================================================================
# 26. Non-root user with passwordless sudo (rootless)
# ==========================================================================
echo "26. Non-root user with passwordless sudo"
init_state
printf '1000\n' > "$STATE/uid"
printf 'deploy\n' > "$STATE/user"
printf '1\n' > "$STATE/sudo_passwordless"
run_install_capture
assert_rc "$RC" 0 "installs as a non-root user with passwordless sudo"
assert_contains "$OUT" "Running as deploy with sudo privileges" "reports the elevation model"
assert_logged "sudo docker swarm init" "initializes the Swarm through sudo"
assert_logged "sudo docker service create" "creates services through sudo"
assert_logged "sudo docker network create" "creates the network through sudo"
assert_file_exists "$CASE_DIR/etc/notploy/identity/instance.key" "bootstraps the identity as the sudoer"
assert_not_contains "$OUT" "must be run as root" "no longer demands running as root"

# ==========================================================================
# 27. Non-root user without passwordless sudo fails closed
# ==========================================================================
echo "27. Non-root user without passwordless sudo"
init_state
printf '1000\n' > "$STATE/uid"
printf 'deploy\n' > "$STATE/user"
printf '0\n' > "$STATE/sudo_passwordless"
run_install_capture
assert_rc "$RC" 1 "refuses to mutate the host without privileges"
assert_contains "$OUT" "passwordless sudo" "explains how to grant privileges"
assert_not_logged "docker swarm init" "does not initialize a Swarm"
assert_not_logged "docker service create" "does not create services"

# ==========================================================================
# 28. Migration reuses Dokploy's auth secret (encrypted columns stay readable)
# ==========================================================================
echo "28. Migration reuses Dokploy's auth secret"
init_state
printf 'active\n' > "$STATE/swarm_state"
printf 'c1|dokploy-postgres|postgres:16||dokploy-network|\n' > "$STATE/containers"
printf 'app1|dokploy|dokploy/dokploy:v24.0.0||dokploy-network|\n' >> "$STATE/containers"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' >> "$STATE/containers"
printf 'dokploy|dokploy/dokploy:v24.0.0\n' > "$STATE/services"
printf 'dokploy-network|overlay\n' > "$STATE/networks"
printf 'CREATE TABLE project (id text primary key);\n' > "$STATE/dump"
printf 'dokployauthsecretvalue\n' > "$STATE/dokploy_auth_secret"
mkdir -p "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic"
printf 'http:\n  routers:\n' > "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic/example.yml"
NOTPLOY_DOKPLOY_CONFIG_PATH="$CASE_DIR/dokploy/etc/dokploy" run_install_capture --migrate
assert_rc "$RC" 0 "migration succeeds while reusing the secret"
assert_logged "docker exec app1 cat /run/secrets/dokploy_auth_secret" "reads Dokploy's auth secret while it still runs"
assert_contains "$OUT" "Reusing the Dokploy auth secret" "announces the reuse"
if grep -q '^notploy_auth_secret|dokployauthsecretvalue$' "$STATE/secret_values" 2>/dev/null; then
    pass "stores Dokploy's original auth secret for Notploy"
else
    fail "stores Dokploy's original auth secret for Notploy"
fi

# ==========================================================================
# 29. Migration fails closed when encrypted values cannot be recovered
# ==========================================================================
echo "29. Migration fails closed on an unrecoverable auth secret"
init_state
printf 'active\n' > "$STATE/swarm_state"
printf 'c1|dokploy-postgres|postgres:16||dokploy-network|\n' > "$STATE/containers"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' >> "$STATE/containers"
printf 'dokploy|dokploy/dokploy:v24.0.0\n' > "$STATE/services"
printf 'dokploy-network|overlay\n' > "$STATE/networks"
printf "CREATE TABLE project (id text primary key);\nINSERT INTO project VALUES ('enc:v1:AAAABBBBCCCC');\n" > "$STATE/dump"
mkdir -p "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic"
printf 'http:\n  routers:\n' > "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic/example.yml"
NOTPLOY_DOKPLOY_CONFIG_PATH="$CASE_DIR/dokploy/etc/dokploy" run_install_capture --migrate
assert_rc "$RC" 1 "aborts instead of orphaning encrypted values"
assert_contains "$OUT" "contains encrypted values" "explains the encryption risk"
assert_contains "$OUT" "NOTPLOY_DOKPLOY_AUTH_SECRET" "documents the recovery override"
assert_not_logged "docker service rm dokploy" "leaves Dokploy running"
assert_file_absent "$CASE_DIR/etc/notploy/traefik/dynamic/example.yml" "does not adopt the config before resolving the secret"

# ==========================================================================
# 30. Migration uses an explicitly provided auth secret as a fallback
# ==========================================================================
echo "30. Migration uses NOTPLOY_DOKPLOY_AUTH_SECRET"
init_state
printf 'active\n' > "$STATE/swarm_state"
printf 'c1|dokploy-postgres|postgres:16||dokploy-network|\n' > "$STATE/containers"
printf 'abc123|dokploy-app|app:1||dokploy-network|\n' >> "$STATE/containers"
printf 'dokploy|dokploy/dokploy:v24.0.0\n' > "$STATE/services"
printf 'dokploy-network|overlay\n' > "$STATE/networks"
printf "CREATE TABLE project (id text primary key);\nINSERT INTO project VALUES ('enc:v1:AAAABBBBCCCC');\n" > "$STATE/dump"
mkdir -p "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic"
printf 'http:\n  routers:\n' > "$CASE_DIR/dokploy/etc/dokploy/traefik/dynamic/example.yml"
NOTPLOY_DOKPLOY_AUTH_SECRET=overridesecretvalue \
    NOTPLOY_DOKPLOY_CONFIG_PATH="$CASE_DIR/dokploy/etc/dokploy" run_install_capture --migrate
assert_rc "$RC" 0 "migrates with an explicitly provided secret"
assert_contains "$OUT" "NOTPLOY_DOKPLOY_AUTH_SECRET" "reports the override source"
if grep -q '^notploy_auth_secret|overridesecretvalue$' "$STATE/secret_values" 2>/dev/null; then
    pass "stores the provided auth secret for Notploy"
else
    fail "stores the provided auth secret for Notploy"
fi

# ==========================================================================
echo ""
printf 'Results: %d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
