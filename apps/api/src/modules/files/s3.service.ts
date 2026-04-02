import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('s3.endpoint');
    const region = this.config.get<string>('s3.region');
    const accessKeyId = this.config.get<string>('s3.accessKeyId');
    const secretAccessKey = this.config.get<string>('s3.secretAccessKey');
    this.bucketName = this.config.get<string>('s3.bucketName') ?? 'antifraude-evidence';
    this.publicUrl = this.config.get<string>('s3.publicUrl') ?? endpoint ?? '';

    this.client = new S3Client({
      region,
      endpoint,
      credentials: accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
      forcePathStyle: true,
    });
  }

  async getPresignedUrl(
    fileName: string,
    mimeType: string,
    size: number,
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    const ext = fileName.split('.').pop() ?? 'bin';
    const key = `reports/${randomUUID()}/${Date.now()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
      ContentLength: size,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
    const publicUrl = `${this.publicUrl}/${key}`;

    return { uploadUrl, publicUrl, key };
  }
}
