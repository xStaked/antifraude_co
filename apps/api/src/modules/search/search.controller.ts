import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SearchService, SearchResult } from './search.service';
import { SearchDto } from './search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async search(@Body() dto: SearchDto): Promise<SearchResult> {
    return this.searchService.searchByPhone(dto.phone);
  }
}
