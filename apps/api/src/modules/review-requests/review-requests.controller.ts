import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ReviewRequestsService } from './review-requests.service';
import { CreateReviewRequestDto } from './review-requests.dto';

@Controller('review-request')
export class ReviewRequestsController {
  constructor(private readonly reviewRequestsService: ReviewRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReviewRequestDto) {
    return this.reviewRequestsService.create(dto);
  }
}
