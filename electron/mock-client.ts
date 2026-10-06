import { EventEmitter } from 'node:events';
import type { EngineClient } from './client';
import { DEFAULT_SETTINGS_FIXTURE } from '../src/fixtures/settings';
import type {
  EngineStatus,
  GetMapsResponse,
  GetSettingsResponse,
  GetVehiclesResponse,
  HandshakeResponse,
  StartSessionRequest,
  StartSessionResponse,
  Status,
} from '../src/types/scaffold';
import { StatusCode } from '../src/types/scaffold';

export class MockEngineClient extends EventEmitter implements EngineClient {
  private status: EngineStatus = {
    connectionState: 'disconnected',
    capabilities: [],
  };

  public getStatus(): EngineStatus {
    return {
      ...this.status,
      capabilities: [...this.status.capabilities],
    };
  }

  public async start(): Promise<EngineStatus> {
    this.status = {
      connectionState: 'connected',
      protocolVersion: '1.0-mock',
      engineVersion: '0.2.0-mock',
      capabilities: ['content.discovery', 'settings.read_write', 'session.lifecycle'],
    };
    this.emit('diagnostic', 'MockEngineClient active');
    this.emit('status', this.getStatus());
    return this.getStatus();
  }

  public async stop(): Promise<void> {
    this.status = {
      connectionState: 'disconnected',
      protocolVersion: undefined,
      engineVersion: undefined,
      capabilities: [],
    };
    this.emit('status', this.getStatus());
  }

  public async sendRequest<T>(type: string, payload: unknown): Promise<T> {
    if (this.status.connectionState !== 'connected') {
      throw new Error('Mock engine is not connected');
    }

    const response = this.dispatchMock(type, payload);
    return response as T;
  }

  private dispatchMock(type: string, payload: unknown): unknown {
    switch (type) {
      case 'handshake':
        return {
          status: { code: StatusCode.STATUS_OK, message: 'OK' },
          protocolVersion: '1.0-mock',
          engineVersion: '0.2.0-mock',
          supportedCapabilities: ['content.discovery', 'settings.read_write', 'session.lifecycle'],
        } as HandshakeResponse;

      case 'get_maps':
        return {
          status: { code: StatusCode.STATUS_OK, message: 'OK' },
          maps: [
            {
              id: 'berlin-spandau',
              name: 'Berlin-Spandau 1989',
              relativePath: 'maps/Berlin-Spandau_1989',
              description: 'Historical Berlin omnibus lines 92 and 13N.',
              tileCount: 94,
              hasChronology: true,
            },
            {
              id: 'grundorf',
              name: 'Grundorf',
              relativePath: 'maps/Grundorf',
              description: 'Standard test and training map.',
              tileCount: 4,
              hasChronology: false,
            },
          ],
        } as GetMapsResponse;

      case 'get_vehicles':
        return {
          status: { code: StatusCode.STATUS_OK, message: 'OK' },
          vehicles: [
            {
              id: 'man-sd200-sd80',
              name: 'MAN SD200 (SD80)',
              manufacturer: 'MAN',
              relativePath: 'Vehicles/MAN_SD200/MAN_SD80.bus',
              availablePaints: ['Standard Beige', 'Pop Werbung', 'White'],
              availableHofs: ['Spandau 1989', 'Grundorf'],
            },
            {
              id: 'man-sd202-d92',
              name: 'MAN SD202 (D92)',
              manufacturer: 'MAN',
              relativePath: 'Vehicles/MAN_SD202/MAN_D92.bus',
              availablePaints: ['Standard Beige', 'BVG Corporate'],
              availableHofs: ['Spandau 1989', 'Grundorf'],
            },
          ],
        } as GetVehiclesResponse;

      case 'get_settings':
        return {
          status: { code: StatusCode.STATUS_OK, message: 'OK' },
          settingsJson: JSON.stringify(DEFAULT_SETTINGS_FIXTURE, null, 2),
        } as GetSettingsResponse;

      case 'update_settings':
        return {
          code: StatusCode.STATUS_OK,
          message: 'Settings saved',
        } as Status;

      case 'start_session': {
        const req = payload as StartSessionRequest;
        const sessionId = `sim_${Date.now()}`;
        setTimeout(() => {
          this.emit('session_event', {
            sessionId,
            state: 3, // RUNNING
            message: `Simulation started for map ${req.mapId}`,
          });
        }, 300);
        return {
          status: { code: StatusCode.STATUS_OK, message: 'Session launched' },
          sessionId,
        } as StartSessionResponse;
      }

      case 'stop_session':
        return {
          code: StatusCode.STATUS_OK,
          message: 'Session stopped',
        } as Status;

      default:
        throw new Error(`Unsupported mock request type: ${type}`);
    }
  }
}
