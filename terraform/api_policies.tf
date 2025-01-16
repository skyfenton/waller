data "aws_iam_policy_document" "put_object_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject"
    ]
    resources = [
      "arn:aws:s3:::waller-images/*"
    ]
  }
}

data "aws_iam_policy_document" "get_object_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "arn:aws:s3:::waller-images/*"
    ]
  }
}
