import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadService implements OnModuleInit {
  private minio: MinioClient;
  private bucket: string;
  private logger = new Logger(UploadService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const endPoint = this.config.get('MINIO_ENDPOINT', 'localhost');
    const port = parseInt(this.config.get('MINIO_PORT', '9000'), 10);
    const accessKey = this.config.get('MINIO_ACCESS_KEY', 'cocminio');
    const secretKey = this.config.get('MINIO_SECRET_KEY', 'cocminio_password');
    this.bucket = this.config.get('MINIO_BUCKET', 'coc-files');

    this.minio = new MinioClient({
      endPoint,
      port,
      useSSL: false,
      accessKey,
      secretKey,
    });

    this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.minio.bucketExists(this.bucket);
      if (!exists) {
        await this.minio.makeBucket(this.bucket);
        // Set public read policy
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.minio.setBucketPolicy(this.bucket, JSON.stringify(policy));
        this.logger.log(`Created bucket: ${this.bucket}`);
      }
    } catch (err) {
      this.logger.warn(`MinIO not available, falling back to local storage: ${err.message}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<{ url: string; key: string }> {
    const ext = path.extname(file.originalname) || '.png';
    const key = `${folder}/${uuid()}${ext}`;

    try {
      await this.minio.putObject(this.bucket, key, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
      const endPoint = this.config.get('MINIO_ENDPOINT', 'localhost');
      const port = this.config.get('MINIO_PORT', '9000');
      const url = `http://${endPoint}:${port}/${this.bucket}/${key}`;
      return { url, key };
    } catch (err) {
      this.logger.error(`Upload failed: ${err.message}`);
      throw err;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.minio.removeObject(this.bucket, key);
    } catch (err) {
      this.logger.warn(`Delete failed: ${err.message}`);
    }
  }
}
