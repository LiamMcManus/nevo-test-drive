import express, { Request, Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import { getAvailableVehicle, isVehicleAvailable, readVehicles, readReservations, saveReservations, getNextReservationId } from './utils/scheduler';

dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get('/', (req: Request, res: Response) => {
  res.send('Nevo backend is running');
});

app.get('/availability', async (req: Request, res: Response): Promise<void> => {
  const { location, vehicleType, startDateTime, durationMins } = req.query;

  if (!location || !vehicleType || !startDateTime || !durationMins) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  const availableVehicle = await getAvailableVehicle(
    location.toString(),
    vehicleType.toString(),
    dayjs.utc(startDateTime.toString()),
    parseInt(durationMins.toString(), 10)
  );

  if (!availableVehicle) {
    res.status(404).json({ available: false });
    return;
  }

  res.json({ available: true, vehicleId: availableVehicle.id });
});

app.post('/schedule', async (req: Request, res: Response): Promise<void> => {
  const { vehicleId, startDateTime, durationMins, customerName, customerPhone, customerEmail } = req.body;

  if (!vehicleId || !startDateTime || !durationMins || !customerName || !customerPhone || !customerEmail) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const start = dayjs.utc(startDateTime);
  const end = start.add(durationMins, 'minute');

  const available = await isVehicleAvailable(vehicleId, start, end);

  if (!available) {
    res.status(409).json({ error: 'Vehicle not available for the selected time' });
    return;
  }

  const reservations = await readReservations();
  const newId = getNextReservationId(reservations);
  const newReservation = {
    id: newId,
    vehicleId,
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    customerName,
    customerEmail,
    customerPhone
  };
  reservations.push(newReservation);

  await saveReservations(reservations);

  res.json({ status: 'confirmed', reservationId: newReservation.id });
});

app.get('/vehicles', async (req: Request, res: Response): Promise<void> => {
  const { location } = req.query;
  if (!location) {
    res.status(400).json({ error: 'Missing location parameter' });
    return;
  }

  const vehicles = await readVehicles();
  const filtered = vehicles.filter((v: { location: string; }) => v.location.toLowerCase() === location.toString().toLowerCase());
  res.json({ vehicles: filtered });
});

app.listen(PORT, () => {
  console.log(`Nevo Test Drive Service is running on port ${PORT}`);
});