cd $(dirname $BASH_SOURCE)
cd ..

PROJ_DIR=$(printf "%q\n" "$(pwd)")

echo "Project Directory: $PROJ_DIR"

eval cd "$PROJ_DIR/python-backend/"

pip install -r requirements.txt

eval cd "$PROJ_DIR/react-frontend/"

pnpm install