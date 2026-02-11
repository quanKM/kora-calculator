import React from 'react';
import type { Room } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface RoomPricingFormProps {
  rooms: Room[];
  onSubmit: (roomId: string, start: string, end: string) => void;
  isLoading?: boolean;
}

export const RoomPricingForm: React.FC<RoomPricingFormProps> = ({ rooms, onSubmit, isLoading }) => {
  const [selectedRoomId, setSelectedRoomId] = React.useState<string>('');
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  const handleDateTimeChange = (value: string, setter: (val: string) => void) => {
    if (!value) {
      setter('');
      return;
    }
    // Force minutes and seconds to 00
    const [datePart, timePart] = value.split('T');
    if (timePart) {
      const [hours] = timePart.split(':');
      setter(`${datePart}T${hours}:00`);
    } else {
      setter(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Vui lòng chọn thời gian nhận và trả phòng.');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('Thời gian trả phòng phải sau thời gian nhận phòng.');
      return;
    }

    // Pass ISO strings
    onSubmit(selectedRoomId, startDate, endDate);
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">Tính Tiền Phòng</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="room-select">Chọn Phòng</Label>
            <Select onValueChange={setSelectedRoomId} value={selectedRoomId}>
              <SelectTrigger id="room-select">
                <SelectValue placeholder="Chọn loại phòng..." />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} ({room.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Nhận Phòng</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startDate}
                onChange={(e) => handleDateTimeChange(e.target.value, setStartDate)}
                step="3600" // 1 hour step
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">Trả Phòng</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endDate}
                onChange={(e) => handleDateTimeChange(e.target.value, setEndDate)}
                step="3600"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Đang tính...' : 'Tính Toán'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
