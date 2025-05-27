import React, { useEffect, useState } from 'react';

interface Vehicle {
  id: string;
  type: string;
  location: string;
  availableDays: string[];
  availableFromTime: string;
  availableToTime: string;
  minimumMinutesBetweenBookings: number;
}

interface TimeSlot {
  label: string;
  iso: string;
}

interface Props {
  vehicleType: string;
}


const NevoBooking: React.FC<Props> = ({ vehicleType }) => {
  const [location, setLocation] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  const fetchVehicles = async (loc: string) => {
    const res = await fetch('/vehicles?location=' + loc);
    const data = await res.json();
    const filtered = data.vehicles.filter((v: Vehicle) => v.type === vehicleType);
    setVehicles(filtered);
  };

  const generateAvailableDates = (v: Vehicle) => {
    const today = new Date();
    const days: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      if (v.availableDays.includes(weekday)) {
        days.push(d.toISOString().split('T')[0]);
      }
    }
    setAvailableDates(days);
  };

  const fetchTimeSlots = async (v: Vehicle, date: string) => {
    const times: TimeSlot[] = [];
    const [fromH, fromM] = v.availableFromTime.split(':').map(Number);
    const [toH, toM] = v.availableToTime.split(':').map(Number);
    const minSlot = 45 + v.minimumMinutesBetweenBookings;
    const start = new Date(date);
    start.setUTCHours(fromH, fromM, 0, 0);
    const end = new Date(date);
    end.setUTCHours(toH, toM, 0, 0);

    for (let current = new Date(start); current < end; current.setMinutes(current.getMinutes() + minSlot)) {
      const iso = current.toISOString();
      const available = await fetch(`/availability?location=${v.location}&vehicleType=${v.type}&startDateTime=${iso}&durationMins=45`);
      const result = await available.json();
      if (result.available) {
        times.push({ label: current.toISOString().substr(11, 5), iso });
      }
    }
    setAvailableTimes(times);
  };

  const handleBooking = async () => {
    if (!selectedVehicle || !selectedTime) return;
    const res = await fetch('/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: selectedVehicle.id,
        startDateTime: selectedTime,
        durationMins: 45,
        customerName,
        customerPhone,
        customerEmail
      })
    });
    const data = await res.json();
    if (res.ok) {
      setBookingStatus('Booking confirmed! Reference: ' + data.reservationId);
    } else {
      setBookingStatus('Booking failed: ' + data.error);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto border rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Book your EV Test Drive</h2>

      {/* Step 1: Select location */}
      <div className="mb-4">
        <label className="block mb-1">Select Location:</label>
        <select value={location} onChange={(e) => {
          setLocation(e.target.value);
          setSelectedVehicle(null);
          setAvailableDates([]);
          setSelectedDate('');
          setAvailableTimes([]);
          setSelectedTime('');
          fetchVehicles(e.target.value);
        }} className="w-full border p-2 rounded">
          <option value="">-- Choose --</option>
          <option value="dublin">Dublin</option>
          <option value="cork">Cork</option>
        </select>
      </div>

      {/* Step 2: Select vehicle */}
      {vehicles.length > 0 && (
        <div className="mb-4">
          <label className="block mb-1">Select Vehicle:</label>
          <select value={selectedVehicle?.id || ''} onChange={(e) => {
            const vehicle = vehicles.find(v => v.id === e.target.value) || null;
            setSelectedVehicle(vehicle);
            setSelectedDate('');
            setAvailableTimes([]);
            setSelectedTime('');
            if (vehicle) generateAvailableDates(vehicle);
          }} className="w-full border p-2 rounded">
            <option value="">-- Choose --</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
          </select>
        </div>
      )}

      {/* Step 3: Select date */}
      {selectedVehicle && availableDates.length > 0 && (
        <div className="mb-4">
          <label className="block mb-1">Select Date:</label>
          <select value={selectedDate} onChange={(e) => {
            setSelectedDate(e.target.value);
            fetchTimeSlots(selectedVehicle, e.target.value);
          }} className="w-full border p-2 rounded">
            <option value="">-- Choose --</option>
            {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
          </select>
        </div>
      )}

      {/* Step 4: Select time */}
      {selectedDate && availableTimes.length > 0 && (
        <div className="mb-4">
          <label className="block mb-1">Select Time:</label>
          <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full border p-2 rounded">
            <option value="">-- Choose --</option>
            {availableTimes.map(t => <option key={t.iso} value={t.iso}>{t.label}</option>)}
          </select>
        </div>
      )}

      {/* Step 5: User details */}
      {selectedTime && (
        <div className="mb-4">
          <label className="block mb-1">Name</label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mb-2 w-full border p-2 rounded" />

          <label className="block mb-1">Phone</label>
          <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mb-2 w-full border p-2 rounded" />

          <label className="block mb-1">Email</label>
          <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="mb-4 w-full border p-2 rounded" />

          <button onClick={handleBooking} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">Book</button>
        </div>
      )}

      {bookingStatus && <p className="mt-4 text-center font-semibold">{bookingStatus}</p>}
    </div>
  );
};

export default NevoBooking;