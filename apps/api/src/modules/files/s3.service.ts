import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

type S3UploadClient = S3Client & {
  send(command: PutObjectCommand): Promise<unknown>;
};

@Injectable()
export class S3Service {
  private readonly client: S3UploadClient;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('s3.endpoint') ?? process.env.S3_ENDPOINT;
    const region = this.config.get<string>('s3.region') ?? process.env.S3_REGION;
    const accessKeyId = this.config.get<string>('s3.accessKeyId') ?? process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = this.config.get<string>('s3.secretAccessKey') ?? process.env.S3_SECRET_ACCESS_KEY;
    this.bucketName = this.config.get<string>('s3.bucketName') ?? process.env.S3_BUCKET_NAME ?? 'antifraude-evidence';
    this.publicUrl = this.config.get<string>('s3.publicUrl') ?? process.env.S3_PUBLIC_URL ?? endpoint ?? '';
    


    // Detect if using R2 (Cloudflare) vs MinIO/S3
    const isR2 = endpoint?.includes('r2.cloudflarestorage.com');
    
    this.client = new S3Client({
      region: region || 'auto',
      endpoint,
      credentials: accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
      // R2 uses virtual-hosted style, MinIO uses path-style
      forcePathStyle: !isR2,
    }) as S3UploadClient;
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

  async uploadBuffer(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
    });

    await this.client.send(command);
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
