#!/bin/sh
#
# Deprecated wrapper.
#
# This file used to be a divergent copy of install.sh and still contained
# destructive operations (automatic `docker swarm leave --force`, `chmod 777`,
# `docker network rm -f`, a silent Traefik 3.5 fallback). It is now a thin shim
# so there is a single, hardened installer to audit and maintain.
#
# It simply forwards all arguments (and the environment/stdin) to install.sh.

set -e

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

for candidate in \
    "$script_dir/install.sh" \
    "$script_dir/../install.sh" \
    "$script_dir/install-notploy.sh"; do
    if [ -f "$candidate" ]; then
        exec sh "$candidate" "$@"
    fi
done

echo "Error: install.sh was not found next to $0 or in its parent directory." >&2
echo "This wrapper is deprecated; fetch the installer from https://notploy.com/install.sh" >&2
exit 1
