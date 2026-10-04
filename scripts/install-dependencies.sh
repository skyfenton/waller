cd $(dirname $BASH_SOURCE)
cd ..

PROJ_DIR=$(printf "%q\n" "$(pwd)")

echo "Project Directory: $PROJ_DIR"

eval cd "$PROJ_DIR/python-backend/"

command -v uv >/dev/null 2>&1 || pip install uv
uv sync

eval cd "$PROJ_DIR/react-frontend/"

pnpm install