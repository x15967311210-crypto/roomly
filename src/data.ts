import type { Room } from './types';

/**
 * 固定会议室清单。刻意不做增删改：会议室是"环境"，预约才是业务数据，
 * 这样每次演示/测试都从同一组房间出发（可重复）。
 */
export const ROOMS: Room[] = [
  { id: 'room-bamboo', name: '青竹厅', capacity: 6, equipment: ['投影仪', '白板'], floor: '3F' },
  {
    id: 'room-pine',
    name: '赤松厅',
    capacity: 12,
    equipment: ['投影仪', '视频会议', '白板'],
    floor: '3F',
  },
  { id: 'room-sea', name: '碧海厅', capacity: 20, equipment: ['投影仪', '视频会议'], floor: '5F' },
  { id: 'room-sun', name: '暖阳角', capacity: 4, equipment: ['白板'], floor: '5F' },
];

export function roomById(roomId: string): Room | undefined {
  return ROOMS.find(room => room.id === roomId);
}
