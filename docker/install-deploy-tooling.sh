#!/usr/bin/env bash
#
# Installs the tooling Notploy needs at runtime to drive the host Docker Engine
# and to build/deploy applications (docker CLI, nixpacks, railpack, plus the few
# system utilities the deployment pipeline shells out to).
#
# Shared by the `dev` and `selfhosted` stages of the Dockerfile so both flavours
# expose exactly the same commands — a dev container without the docker CLI
# makes every Docker page (containers, images, volumes, events, disk usage)
# fail with `docker: not found`.
#
# Run as root inside a Debian-based image. Not meant to be executed on a host.
set -euo pipefail

DOCKER_VERSION="${DOCKER_VERSION:-28.5.2}"
NIXPACKS_VERSION="${NIXPACKS_VERSION:-1.41.0}"
RAILPACK_VERSION="${RAILPACK_VERSION:-0.15.4}"

log() { printf '[tooling] %s\n' "$*"; }

# Transient DNS/resolver failures inside the build sandbox are the difference
# between a green build and `curl: (6) Could not resolve host`. Every download
# below goes through this helper so it retries before giving up.
fetch() {
	curl -fsSL --retry 5 --retry-all-errors --retry-delay 2 "$@"
}

# Maps `uname -m` to the target triple used by the release archives.
release_target() {
	case "$(uname -m)" in
	x86_64) printf 'x86_64-unknown-linux-musl' ;;
	aarch64 | arm64) printf 'arm64-unknown-linux-musl' ;;
	*) return 1 ;;
	esac
}

log "installing system packages"
apt-get update
apt-get install -y --no-install-recommends \
	ca-certificates \
	curl \
	git-lfs \
	iproute2 \
	rsync
git lfs install
rm -rf /var/lib/apt/lists/*

# The docker CLI talks to the host engine through the mounted socket; the daemon
# itself is never started inside the container.
log "installing the docker CLI (${DOCKER_VERSION})"
fetch https://get.docker.com -o /tmp/get-docker.sh
sh /tmp/get-docker.sh --version "${DOCKER_VERSION}"
rm -f /tmp/get-docker.sh

log "installing nixpacks (${NIXPACKS_VERSION})"
fetch https://nixpacks.com/install.sh -o /tmp/nixpacks-install.sh
chmod +x /tmp/nixpacks-install.sh
/tmp/nixpacks-install.sh
rm -f /tmp/nixpacks-install.sh

# Installed straight from the GitHub release instead of `railpack.com/install.sh`
# so a DNS blip on that single domain cannot break the whole image build; the
# tarball is checksum-verified the same way the upstream installer does it.
log "installing railpack (${RAILPACK_VERSION})"
target="$(release_target)" || {
	log "unsupported architecture: $(uname -m)"
	exit 1
}
archive="railpack-v${RAILPACK_VERSION}-${target}.tar.gz"
release_base="https://github.com/railwayapp/railpack/releases/download/v${RAILPACK_VERSION}"
fetch "${release_base}/${archive}" -o "/tmp/${archive}"
fetch "${release_base}/checksums.txt" -o /tmp/railpack-checksums.txt
(cd /tmp && grep " ${archive}\$" railpack-checksums.txt | sha256sum -c -)
tar -xzf "/tmp/${archive}" -C /usr/local/bin railpack
chmod 0755 /usr/local/bin/railpack
rm -f "/tmp/${archive}" /tmp/railpack-checksums.txt

log "done"
