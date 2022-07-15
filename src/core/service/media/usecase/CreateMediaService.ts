import { Media } from '@core/domain/media/entity/Media'
import { MediaFileStoragePort } from '@core/domain/media/port/persistence/MediaFileStoragePort'
import { MediaRepositoryPort } from '@core/domain/media/port/persistence/MediaRepositoryPort'
import { CreateMediaPort } from '@core/domain/media/port/usecase/CreateMediaPort'
import { CreateMediaUseCase } from '@core/domain/media/usecase/CreateMediaUseCase'
import { MediaUseCaseDto } from '@core/domain/media/usecase/dto/MediaUseCaseDto'
import { FileMetadata } from '@core/domain/media/value-object/FileMetadata'

export class CreateMediaService implements CreateMediaUseCase {
  constructor(
    private readonly mediaRepository: MediaRepositoryPort,
    private readonly mediaFileStorage: MediaFileStoragePort,
  ) {}

  public async execute(payload: CreateMediaPort): Promise<MediaUseCaseDto> {
    const fileMetaData: FileMetadata = await this.mediaFileStorage.upload(
      payload.file,
      { type: payload.type },
    )

    const media: Media = await Media.new({
      ownerId: payload.executorId,
      name: payload.name,
      type: payload.type,
      metadata: fileMetaData,
    })

    await this.mediaRepository.addMedia(media)

    // ? 미디어 도메인 객체 생성 후 생성 했음을 알리는 이벤트를 발송해야 할듯

    return MediaUseCaseDto.newFromMedia(media)
  }
}
