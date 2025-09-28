import apiClient from "./api.client";
import type {
  CronJob,
  CronJobExecution,
  CreateCronDto,
  UpdateCronDto,
} from "@/types";

export const cronService = {
  async getCronJobs(): Promise<CronJob[]> {
    const response = await apiClient.get<CronJob[]>('/crons');
    return response.data;
  },

  async getCronJob(id: string): Promise<CronJob> {
    const response = await apiClient.get<CronJob>(`/crons/${id}`);
    return response.data;
  },

  async createCronJob(data: CreateCronDto): Promise<CronJob> {
    const response = await apiClient.post<CronJob>('/crons', data);
    return response.data;
  },

  async updateCronJob(id: string, data: UpdateCronDto): Promise<CronJob> {
    const response = await apiClient.patch<CronJob>(`/crons/${id}`, data);
    return response.data;
  },

  async deleteCronJob(id: string): Promise<void> {
    await apiClient.delete(`/crons/${id}`);
  },

  async toggleCronJob(id: string): Promise<CronJob> {
    const response = await apiClient.post<CronJob>(`/crons/${id}/toggle`);
    return response.data;
  },

  async runCronJob(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/crons/${id}/run`
    );
    return response.data;
  },

  async getCronJobExecutions(id: string): Promise<CronJobExecution[]> {
    const response = await apiClient.get<CronJobExecution[]>(
      `/crons/${id}/executions`
    );
    return response.data;
  },
};