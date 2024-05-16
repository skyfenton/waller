cd $(dirname $BASH_SOURCE)
cd ..

PROJ_DIR=$(pwd)

echo "Project Directory: $PROJ_DIR"

cd ${PROJ_DIR}/python-backend

pip install -r requirements.txt

cd ${PROJ_DIR}/react-frontend

pnpm install