import fs from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

const VEHICLES_FILE = path.join(__dirname, '../../data/vehicles.json');
const RESERVATIONS_FILE = path.join(__dirname, '../../data/reservations.json');

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export async function readVehicles() {
  const data = await fs.readFile(VEHICLES_FILE, 'utf-8');
  return JSON.parse(data).vehicles;
}

export async function readReservations() {
  const data = await fs.readFile(RESERVATIONS_FILE, 'utf-8');
  return JSON.parse(data).reservations;
}

export async function saveReservations(reservations: any[]) {
  await fs.writeFile(RESERVATIONS_FILE, JSON.stringify({ reservations }, null, 2));
}

export function getNextReservationId(reservations: any[]): number {
  const ids = reservations
    .map((r) => typeof r.id === 'number' ? r.id : parseInt(r.id))
    .filter((id) => !isNaN(id));

  return ids.length > 0 ? Math.max(...ids) + 1 : 20000;
}

export async function getAvailableVehicle(location: string, type: string, start: dayjs.Dayjs, durationMins: number) {
  const vehicles = await readVehicles();
  const reservations = await readReservations();

  const filtered = vehicles.filter((v: any) =>
    v.location.toLowerCase() === location.toLowerCase() &&
    v.type === type &&
    v.availableDays.includes(start.format('ddd').toLowerCase())
  );

  const candidates = await Promise.all(
    filtered.map(async (v: any) => {
      const isFree = await isVehicleAvailable(v.id, start, start.add(durationMins, 'minute'));
      return isFree ? v : null;
    })
  );

  const available = candidates.filter(Boolean);

  if (available.length === 0) return null;

  const bookingCounts = available.map((v: any) => ({
    vehicle: v,
    count: reservations.filter((r: any) => r.vehicleId === v.id).length
  }));

  bookingCounts.sort((a, b) => a.count - b.count);
  return bookingCounts[0].vehicle;
}

export async function isVehicleAvailable(vehicleId: string, start: dayjs.Dayjs, end: dayjs.Dayjs) {
  const vehicles = await readVehicles();
  const vehicle = vehicles.find((v: any) => v.id === vehicleId);
  if (!vehicle) return false;

  const reservations = await readReservations();

  const minGap = vehicle.minimumMinutesBetweenBookings;
  const dayStart = dayjs.utc(start.format('YYYY-MM-DD') + 'T' + vehicle.availableFromTime);
  const dayEnd = dayjs.utc(start.format('YYYY-MM-DD') + 'T' + vehicle.availableToTime);

  if (!(start.isSameOrAfter(dayStart) && end.isSameOrBefore(dayEnd))) return false;

  const overlapping = reservations.some((r: any) => {
    if (r.vehicleId !== vehicleId) return false;
    const rStart = dayjs.utc(r.startDateTime);
    const rEnd = dayjs.utc(r.endDateTime);
    return start.isBefore(rEnd.add(minGap, 'minute')) && end.isAfter(rStart.subtract(minGap, 'minute'));
  });

  return !overlapping;
}
