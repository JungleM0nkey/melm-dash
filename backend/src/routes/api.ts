import type { FastifyInstance } from 'fastify';
import { metricsStore } from '../services/metrics-store.js';
import { broadcastManager } from '../services/broadcast.js';

export async function apiRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check
  fastify.get('/health', async () => {
    const system = metricsStore.getSystem();
    return {
      status: 'ok',
      uptime: system?.uptime || 0,
      websocketClients: broadcastManager.getClientCount(),
      timestamp: Date.now(),
    };
  });

  // System info
  fastify.get('/api/system/info', async () => {
    return metricsStore.getSystem();
  });

  // System resources (CPU + Memory with history)
  fastify.get('/api/system/resources', async () => {
    return {
      cpu: metricsStore.getCpu(),
      memory: metricsStore.getMemory(),
      cpuHistory: metricsStore.getCpuHistory(),
      memoryHistory: metricsStore.getMemoryHistory(),
    };
  });

  // Docker containers
  fastify.get('/api/docker/containers', async () => {
    return metricsStore.getDocker();
  });

  // Network interfaces and bandwidth
  fastify.get('/api/network/interfaces', async () => {
    const network = metricsStore.getNetwork();
    return {
      ...network,
      history: metricsStore.getNetworkHistory(),
    };
  });

  // Storage drives
  fastify.get('/api/storage/drives', async () => {
    return metricsStore.getStorage();
  });

  // Systemd services
  fastify.get('/api/services', async () => {
    return metricsStore.getServices();
  });

  // Listening ports
  fastify.get('/api/ports', async () => {
    return metricsStore.getPorts();
  });

  // Full snapshot (all data)
  fastify.get('/api/snapshot', async () => {
    return metricsStore.getSnapshot();
  });
}
