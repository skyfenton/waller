cd $(dirname $BASH_SOURCE)
cd ..

PROJ_DIR=$(printf "%q\n" "$(pwd)")
# PROJ_DIR="/workspaces/'21.13 waller'"

echo "Project Directory: $PROJ_DIR"

eval cd "$PROJ_DIR/python-backend/"

pip install -r requirements.txt

eval cd "$PROJ_DIR/react-frontend/"

pnpm install