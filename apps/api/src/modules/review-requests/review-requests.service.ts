import { Injectable } from '@nestjs/common';
import { prisma } from '@sn8/database';
import { normalizeColombianPhone } from '../../shared/utils/phone';
import { CreateReviewRequestDto } from './review-requests.dto';

@Injectable()
export class ReviewRequestsService {
  async create(dto: CreateReviewRequestDto) {
    const normalizedPhone = normalizeColombianPhone(dto.phone);

    const target = await prisma.reportTarget.findUnique({
      where: { normalizedPhone },
      select: { id: true },
    });

    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        normalizedPhone,
        applicantName: dto.applicantName,
        contactEmail: dto.contactEmail,
        reason: dto.reason,
        targetId: target?.id ?? null,
      },
    });

    return {
      id: reviewRequest.id,
      message: 'Solicitud de apelación recibida. Te contactaremos pronto.',
    };
  }
}
