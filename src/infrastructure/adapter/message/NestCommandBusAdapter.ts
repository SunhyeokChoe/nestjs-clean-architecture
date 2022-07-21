import { CommandBusPort } from '@core/common/port/message/CommandBusPort'
import { Injectable } from '@nestjs/common'
import { CommandBus, ICommand } from '@nestjs/cqrs'

@Injectable()
export class NestCommandBusAdapter implements CommandBusPort {
  constructor(private readonly commandBus: CommandBus) {}

  public async sendCommand<TCommand extends ICommand>(command: TCommand): Promise<void> {
    return this.commandBus.execute(command)
  }
}
