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

data "aws_iam_policy_document" "del_object_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:DeleteObject"
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

data "aws_iam_policy_document" "db_write_policy" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:BatchWriteItem"
    ]
    resources = [
      "arn:aws:dynamodb:*:*:table/waller"
    ]
  }
}

data "aws_iam_policy_document" "db_get_policy" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:Scan"
    ]
    resources = [
      "arn:aws:dynamodb:*:*:table/waller"
    ]
  }
}
