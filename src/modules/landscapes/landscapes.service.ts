import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class LandscapesService {
  constructor(private config: ConfigService) {}

  async getLandscapes(): Promise<any> {
    try {
      const response = await axios.get(
        `https://pixabay.com/api/?key=${this.config.get<string>(
          'API_KEY_PIXABAY',
        )}=landscapes&image_type=photo`,
      );

      return await response.data;
    } catch (error) {
      throw new BadRequestException('Erros list landscape');
    }
  }
}
