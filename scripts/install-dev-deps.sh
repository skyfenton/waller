# Installs packages and tools into devcontainer

cd $(dirname $BASH_SOURCE)
cd ..

PROJ_DIR=$(printf "%q\n" "$(pwd)")

echo "Project Directory: $PROJ_DIR"

# eval cd "$PROJ_DIR/python-backend/"

# pip install -r requirements.txt

eval cd "$PROJ_DIR/react-frontend/"

# Install npm packages for frontend
pnpm install

eval cd "$PROJ_DIR"

# Install pytest
pip install pytest

# Install localstack for running aws infrastructure locally
pip install terraform-local

# Install pipreqs for only pinning imported packages
pip install pipreqs

# Boto3 types
pip install 'types-boto3[essential]'

pip install 'moto[s3]'