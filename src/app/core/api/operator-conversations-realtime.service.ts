import { Injectable, NgZone, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';

import { ApiConfigService } from '@core/config/api-config.service';
import { OperatorConversationDetail, OperatorConversationSummary } from '@shared/models/operator-conversations.models';

export interface OperatorConversationRealtimeHandlers {
  changed: (conversation: OperatorConversationSummary) => void;
  detailChanged?: (conversation: OperatorConversationDetail) => void;
  removed: (conversationId: string) => void;
  reconnected: () => void;
  statusChanged: (connected: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class OperatorConversationsRealtimeService {
  private readonly config = inject(ApiConfigService);
  private readonly zone = inject(NgZone);
  private connection: signalR.HubConnection | null = null;

  async connect(
    tenantId: string,
    businessUnitId: string,
    handlers: OperatorConversationRealtimeHandlers
  ): Promise<void> {
    await this.disconnect();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(this.config.buildUrl('/hubs/operator-conversations'), { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    connection.on('operatorConversationChanged', (conversation: OperatorConversationSummary) => {
      this.zone.run(() => handlers.changed(conversation));
    });

    connection.on('operatorConversationRemoved', (conversationId: string) => {
      this.zone.run(() => handlers.removed(conversationId));
    });

    connection.on('operatorConversationDetailChanged', (conversation: OperatorConversationDetail) => {
      this.zone.run(() => handlers.detailChanged?.(conversation));
    });

    connection.onreconnecting(() => {
      this.zone.run(() => handlers.statusChanged(false));
    });

    connection.onreconnected(async () => {
      try {
        await connection.invoke('JoinBusinessUnit', tenantId, businessUnitId);
        this.zone.run(() => {
          handlers.statusChanged(true);
          handlers.reconnected();
        });
      } catch {
        this.zone.run(() => handlers.statusChanged(false));
      }
    });

    connection.onclose(() => {
      this.zone.run(() => handlers.statusChanged(false));
    });

    this.connection = connection;
    await connection.start();
    await connection.invoke('JoinBusinessUnit', tenantId, businessUnitId);
    this.zone.run(() => {
      handlers.statusChanged(true);
      handlers.reconnected();
    });
  }

  async disconnect(): Promise<void> {
    const connection = this.connection;
    this.connection = null;

    if (connection) {
      await connection.stop();
    }
  }
}
