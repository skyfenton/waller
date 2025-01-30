
# Download model
FROM public.ecr.aws/lambda/python:3.12 AS model-dl
ARG MODEL_ID=facebook/mask2former-swin-small-ade-semantic
RUN pip install huggingface_hub
RUN huggingface-cli download ${MODEL_ID} --exclude model.safetensors --local-dir /tmp/model


# Build full image
FROM public.ecr.aws/lambda/python:3.12
# Copy model
ENV HF_HOME=/tmp/hf_cache
ENV MODEL_PATH=${LAMBDA_TASK_ROOT}/model
COPY --from=model-dl /tmp/model ${MODEL_PATH}
# Install packages from requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install --no-cache-dir -r requirements.txt
# Copy function code
COPY src ${LAMBDA_TASK_ROOT}/src
# Set the CMD to your handler
CMD [ "src.index.lambda_handler" ]