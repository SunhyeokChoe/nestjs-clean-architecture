import { EventBusPort } from '@core/common/port/message/EventBusPort'
import { Injectable } from '@nestjs/common'
import { EventBus, ICommand } from '@nestjs/cqrs'

@Injectable()
export class NestEventBusAdapter implements EventBusPort {
  constructor(private readonly eventBus: EventBus) {}

  public async sendEvent<TEvent extends ICommand>(event: TEvent): Promise<void> {
    return this.eventBus.publish(event)
  }
}

// ? 도메인 객체 상태가 변화하면 변화 했다는 이벤트를 발생시킴. DDD에서 Domain Layer의 기본 행동 중 하나임
// ? 참조: https://wikidocs.net/158678
