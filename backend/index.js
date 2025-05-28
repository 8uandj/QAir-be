const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/qairline', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Kết nối MongoDB thành công'))
    .catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Cấu hình CORS để cho phép yêu cầu từ http://localhost:3001
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'] // Thêm X-User-Id
}));

app.use(express.json());

// Import các lớp model
const User = require('./models/User');
const Flight = require('./models/Flight');
const Ticket = require('./models/Ticket');
const Announcement = require('./models/Announcement');
const Aircraft = require('./models/Aircraft');

// Định nghĩa schema Mongoose trực tiếp trong index.js
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});
const UserModel = mongoose.model('User', userSchema);

const aircraftSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    manufacturer: { type: String, required: true },
    seats: [
        {
            seatNumber: { type: String, required: true },
            class: { type: String, enum: ['economy', 'business'], required: true }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});
const AircraftModel = mongoose.model('Aircraft', aircraftSchema);

const flightSchema = new mongoose.Schema({
    flight_number: { type: String, required: true, unique: true },
    aircraft: { type: mongoose.Schema.Types.ObjectId, ref: 'Aircraft' },
    departure: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    duration: { type: String, required: true },
    pilot: {
        name: { type: String },
        experience: { type: String }
    },
    notes: { type: String },
    departureImage: { type: String },
    destinationImage: { type: String },
    destinationInfo: { type: String },
    price: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});
const FlightModel = mongoose.model('Flight', flightSchema);

const ticketSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
    seat: { type: String, required: true },
    ticketClassId: { type: String },
    additionalServices: {
        luggage: { type: Boolean, default: false },
        meal: { type: Boolean, default: false }
    },
    status: { type: String, enum: ['booked', 'canceled'], default: 'booked' },
    timeline: [
        {
            step: { type: String, required: true },
            date: { type: Date, required: true },
            completed: { type: Boolean, default: false }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});
const TicketModel = mongoose.model('Ticket', ticketSchema);

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, default: 'general' }, // Thêm trường type
    published_date: { type: Date, default: Date.now }, // Thêm trường published_date
    expiry_date: { type: Date },
    created_by: { type: String, default: 'admin' }, // Thêm trường created_by
    createdAt: { type: Date, default: Date.now }
});
const AnnouncementModel = mongoose.model('Announcement', announcementSchema);

// Khởi tạo dữ liệu mặc định (nếu cần)
const initializeData = async () => {
    try {
        const userCount = await UserModel.countDocuments();
        if (userCount === 0) {
            await UserModel.insertMany([
                { username: "admin", password: "admin123", role: "admin" },
                { username: "user", password: "user123", role: "user" }
            ]);
            console.log('Khởi tạo tài khoản mặc định thành công');
        }

        const aircraftCount = await AircraftModel.countDocuments();
        if (aircraftCount === 0) {
            const aircraft = await AircraftModel.create({
                code: "A320-001",
                manufacturer: "Airbus",
                seats: [
                    { seatNumber: "A1", class: "economy" },
                    { seatNumber: "A2", class: "economy" },
                    { seatNumber: "B1", class: "business" },
                    { seatNumber: "B2", class: "business" }
                ]
            });

            await FlightModel.insertMany([
                {
                    flight_number: "QA123",
                    aircraft: aircraft._id,
                    departure: "Hà Nội",
                    destination: "TP. Hồ Chí Minh",
                    departureTime: new Date("2025-05-28T08:00:00"),
                    arrivalTime: new Date("2025-05-28T10:00:00"),
                    duration: "2 hours",
                    pilot: { name: "Nguyễn Văn A", experience: "10 years" },
                    notes: "Check-in 2 giờ trước khi khởi hành. Hành lý ký gửi: 20kg.",
                    departureImage: "https://images.unsplash.com/photo-1583394838336-acd977736f90",
                    destinationImage: "https://images.unsplash.com/photo-1590004987778-bece5c9adab6",
                    destinationInfo: "TP. Hồ Chí Minh là thành phố lớn nhất Việt Nam, nổi tiếng với văn hóa sôi động và các địa danh lịch sử như Dinh Độc Lập, Nhà thờ Đức Bà.",
                    price: 1500000
                },
                {
                    flight_number: "QA456",
                    aircraft: aircraft._id,
                    departure: "Đà Nẵng",
                    destination: "Hà Nội",
                    departureTime: new Date("2025-05-28T10:00:00"),
                    arrivalTime: new Date("2025-05-28T11:30:00"),
                    duration: "1.5 hours",
                    pilot: { name: "Trần Thị B", experience: "8 years" },
                    notes: "Check-in 1.5 giờ trước khi khởi hành. Hành lý ký gửi: 15kg.",
                    departureImage: "https://images.unsplash.com/photo-1559592417-7d9f9c8d7485",
                    destinationImage: "https://images.unsplash.com/photo-1583394838336-acd977736f90",
                    destinationInfo: "Hà Nội là thủ đô Việt Nam, nổi tiếng với kiến trúc ngàn năm và văn hóa phong phú, như Hồ Hoàn Kiếm, Văn Miếu.",
                    price: 1200000
                },
                {
                    flight_number: "QA789",
                    aircraft: aircraft._id,
                    departure: "TP. Hồ Chí Minh",
                    destination: "Đà Nẵng",
                    departureTime: new Date("2025-05-28T14:00:00"),
                    arrivalTime: new Date("2025-05-28T15:30:00"),
                    duration: "1.5 hours",
                    pilot: { name: "Lê Văn C", experience: "12 years" },
                    notes: "Check-in 2 giờ trước khi khởi hành. Hành lý ký gửi: 20kg.",
                    departureImage: "https://images.unsplash.com/photo-1590004987778-bece5c9adab6",
                    destinationImage: "https://images.unsplash.com/photo-1559592417-7d9f9c8d7485",
                    destinationInfo: "Đà Nẵng là thành phố biển xinh đẹp với cầu Rồng, bãi biển Mỹ Khê và các khu nghỉ dưỡng sang trọng.",
                    price: 1300000
                }
            ]);
            console.log('Khởi tạo dữ liệu chuyến bay mặc định thành công');
        }

        const announcementCount = await AnnouncementModel.countDocuments();
        if (announcementCount === 0) {
            await AnnouncementModel.insertMany([
                { 
                    title: "Khuyến mãi hè 2025", 
                    content: "Giảm 30% giá vé cho tất cả các chuyến bay nội địa từ 01/06/2025 đến 31/08/2025!", 
                    type: "promotion", 
                    published_date: new Date(), 
                    expiry_date: new Date("2025-08-31"), 
                    created_by: "admin", 
                    image: "https://images.unsplash.com/photo-1559592417-7d9f9c8d7485" 
                },
                { 
                    title: "Bay quốc tế giá rẻ", 
                    content: "Giảm 20% giá vé cho các chuyến bay đến Thái Lan và Singapore trong tháng 6/2025.", 
                    type: "promotion", 
                    published_date: new Date(), 
                    expiry_date: new Date("2025-06-30"), 
                    created_by: "admin", 
                    image: "https://images.unsplash.com/photo-1590004987778-bece5c9adab6" 
                },
                { 
                    title: "Tặng voucher 500K", 
                    content: "Đặt vé trong tuần này để nhận voucher 500K cho chuyến bay tiếp theo!", 
                    type: "promotion", 
                    published_date: new Date(), 
                    expiry_date: new Date("2025-05-31"), 
                    created_by: "admin", 
                    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90" 
                }
            ]);
            console.log('Khởi tạo thông báo mặc định thành công');
        }
    } catch (err) {
        console.error('Lỗi khởi tạo dữ liệu:', err);
    }
};
initializeData();

// Flight APIs
app.get('/api/flights', async (req, res) => {
    try {
        const flights = await FlightModel.find().populate('aircraft');
        res.json(flights.map(flight => new Flight({
            id: flight._id,
            flight_number: flight.flight_number,
            aircraft: flight.aircraft,
            departure: flight.departure,
            destination: flight.destination,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            duration: flight.duration,
            pilot: flight.pilot,
            notes: flight.notes,
            departureImage: flight.departureImage,
            destinationImage: flight.destinationImage,
            destinationInfo: flight.destinationInfo,
            price: flight.price,
            createdAt: flight.createdAt
        })));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.get('/api/flights/:id', async (req, res) => {
    try {
        const flight = await FlightModel.findById(req.params.id).populate('aircraft');
        if (!flight) return res.status(404).json({ message: "Chuyến bay không tìm thấy" });
        res.json(new Flight({
            id: flight._id,
            flight_number: flight.flight_number,
            aircraft: flight.aircraft,
            departure: flight.departure,
            destination: flight.destination,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            duration: flight.duration,
            pilot: flight.pilot,
            notes: flight.notes,
            departureImage: flight.departureImage,
            destinationImage: flight.destinationImage,
            destinationInfo: flight.destinationInfo,
            price: flight.price,
            createdAt: flight.createdAt
        }));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.get('/api/flights/search/query', async (req, res) => {
    try {
        const { from, to, date } = req.query;
        let query = {};

        if (from) {
            query.departure = { $regex: from, $options: 'i' };
        }
        if (to) {
            query.destination = { $regex: to, $options: 'i' };
        }
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.departureTime = { $gte: startOfDay, $lte: endOfDay };
        }

        const filteredFlights = await FlightModel.find(query).populate('aircraft');
        res.json(filteredFlights.map(flight => new Flight({
            id: flight._id,
            flight_number: flight.flight_number,
            aircraft: flight.aircraft,
            departure: flight.departure,
            destination: flight.destination,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            duration: flight.duration,
            pilot: flight.pilot,
            notes: flight.notes,
            departureImage: flight.departureImage,
            destinationImage: flight.destinationImage,
            destinationInfo: flight.destinationInfo,
            price: flight.price,
            createdAt: flight.createdAt
        })));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.post('/api/flights', async (req, res) => {
    try {
        const flight = new FlightModel(req.body);
        await flight.save();
        res.status(201).json(new Flight({
            id: flight._id,
            flight_number: flight.flight_number,
            aircraft: flight.aircraft,
            departure: flight.departure,
            destination: flight.destination,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            duration: flight.duration,
            pilot: flight.pilot,
            notes: flight.notes,
            departureImage: flight.departureImage,
            destinationImage: flight.destinationImage,
            destinationInfo: flight.destinationInfo,
            price: flight.price,
            createdAt: flight.createdAt
        }));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.put('/api/flights/:id/delay', async (req, res) => {
    try {
        const { newDeparture, newArrival } = req.body;
        const flight = await FlightModel.findById(req.params.id);
        if (!flight) return res.status(404).json({ message: "Chuyến bay không tìm thấy" });

        flight.departureTime = new Date(newDeparture);
        flight.arrivalTime = new Date(newArrival);
        await flight.save();

        res.json(new Flight({
            id: flight._id,
            flight_number: flight.flight_number,
            aircraft: flight.aircraft,
            departure: flight.departure,
            destination: flight.destination,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            duration: flight.duration,
            pilot: flight.pilot,
            notes: flight.notes,
            departureImage: flight.departureImage,
            destinationImage: flight.destinationImage,
            destinationInfo: flight.destinationInfo,
            price: flight.price,
            createdAt: flight.createdAt
        }));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

// Ticket APIs
app.post('/api/tickets', async (req, res) => {
    try {
        const ticket = new TicketModel(req.body);
        ticket.timeline = [{ step: "Đã đặt", date: new Date(), completed: true }];
        await ticket.save();
        res.status(201).json(new Ticket({
            id: ticket._id,
            customerId: ticket.customerId,
            flightId: ticket.flightId,
            seat: ticket.seat,
            ticketClassId: ticket.ticketClassId,
            additionalServices: ticket.additionalServices,
            status: ticket.status,
            timeline: ticket.timeline,
            createdAt: ticket.createdAt
        }));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.put('/api/tickets/:id/cancel', async (req, res) => {
    try {
        const ticket = await TicketModel.findById(req.params.id).populate('flightId');
        if (!ticket) return res.status(404).json({ message: "Vé không tìm thấy" });

        // Kiểm tra thời gian hủy vé (trước 24 giờ so với giờ khởi hành)
        const flight = ticket.flightId;
        const departureTime = new Date(flight.departureTime);
        const now = new Date();
        const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

        if (hoursUntilDeparture < 24) {
            return res.status(400).json({ message: "Không thể hủy vé: Đã quá thời gian cho phép (trước 24 giờ)." });
        }

        ticket.status = "canceled";
        ticket.timeline.push({ step: "Đã hủy", date: new Date(), completed: true });
        await ticket.save();
        res.json(new Ticket({
            id: ticket._id,
            customerId: ticket.customerId,
            flightId: ticket.flightId,
            seat: ticket.seat,
            ticketClassId: ticket.ticketClassId,
            additionalServices: ticket.additionalServices,
            status: ticket.status,
            timeline: ticket.timeline,
            createdAt: ticket.createdAt
        }));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.get('/api/tickets/track/:code', async (req, res) => {
    try {
        const ticket = await TicketModel.findOne({ _id: req.params.code }).populate('flightId');
        if (!ticket) return res.status(404).json({ message: "Vé không tìm thấy" });
        res.json(new Ticket({
            id: ticket._id,
            customerId: ticket.customerId,
            flightId: ticket.flightId,
            seat: ticket.seat,
            ticketClassId: ticket.ticketClassId,
            additionalServices: ticket.additionalServices,
            status: ticket.status,
            timeline: ticket.timeline,
            createdAt: ticket.createdAt
        }));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.get('/api/tickets', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']; // Lấy userId từ header X-User-Id
        if (!userId) {
            return res.status(401).json({ message: "Yêu cầu đăng nhập để xem vé" });
        }
        const tickets = await TicketModel.find({ customerId: userId }).populate('flightId customerId');
        res.json(tickets.map(ticket => new Ticket({
            id: ticket._id,
            customerId: ticket.customerId,
            flightId: ticket.flightId,
            seat: ticket.seat,
            ticketClassId: ticket.ticketClassId,
            additionalServices: ticket.additionalServices,
            status: ticket.status,
            timeline: ticket.timeline,
            createdAt: ticket.createdAt
        })));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

// Customer APIs
app.post('/api/customers', async (req, res) => {
    try {
        const customer = new UserModel(req.body);
        await customer.save();
        res.status(201).json(new User({
            id: customer._id,
            username: customer.username,
            password: customer.password,
            role: customer.role,
            createdAt: customer.createdAt
        }));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

// Auth APIs
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Username và password là bắt buộc." });
        }
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username đã tồn tại." });
        }
        const newUser = new UserModel({ username, password, role: "user" });
        await newUser.save();
        res.status(201).json({ message: "Đăng ký thành công!", user: new User({
            id: newUser._id,
            username: newUser.username,
            password: newUser.password,
            role: newUser.role,
            createdAt: newUser.createdAt
        }) });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await UserModel.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng."});
        }
        res.json({ token: "fake-jwt-token", userId: user._id, role: user.role });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.get('/api/auth/users', async (req, res) => {
    try {
        const users = await UserModel.find();
        res.json(users.map(user => new User({
            id: user._id,
            username: user.username,
            password: user.password,
            role: user.role,
            createdAt: user.createdAt
        })));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

// Announcement APIs
app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await AnnouncementModel.find();
        res.json(announcements.map(announcement => new Announcement({
            id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            type: announcement.type || 'general',
            published_date: announcement.createdAt,
            expiry_date: announcement.expiryDate,
            created_by: 'admin'
        })));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.post('/api/announcements', async (req, res) => {
    try {
        const announcement = new AnnouncementModel({
            title: req.body.title,
            content: req.body.content,
            type: req.body.type || 'general',
            published_date: new Date(),
            expiry_date: req.body.expiry_date,
            created_by: 'admin'
        });
        await announcement.save();
        res.status(201).json(new Announcement({
            id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            published_date: announcement.createdAt,
            expiry_date: announcement.expiryDate,
            created_by: announcement.created_by
        }));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

// Aircraft APIs
app.get('/api/aircrafts', async (req, res) => {
    try {
        const aircrafts = await AircraftModel.find();
        res.json(aircrafts.map(aircraft => new Aircraft({
            id: aircraft._id,
            code: aircraft.code,
            manufacturer: aircraft.manufacturer,
            seats: aircraft.seats,
            createdAt: aircraft.createdAt
        })));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.post('/api/aircrafts', async (req, res) => {
    try {
        const aircraft = new AircraftModel(req.body);
        await aircraft.save();
        res.status(201).json(new Aircraft({
            id: aircraft._id,
            code: aircraft.code,
            manufacturer: aircraft.manufacturer,
            seats: aircraft.seats,
            createdAt: aircraft.createdAt
        }));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

// Ticket Class APIs
app.get('/api/ticket-classes', async (req, res) => {
    try {
        const ticketClasses = [
            { id: 1, name: "Phổ thông", priceMultiplier: 1 },
            { id: 2, name: "Thương gia", priceMultiplier: 1.5 }
        ];
        res.json(ticketClasses);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

// Ticket Stats API
app.get('/api/ticket-stats', async (req, res) => {
    try {
        const totalTickets = await TicketModel.countDocuments();
        const bookedTickets = await TicketModel.countDocuments({ status: 'booked' });
        const canceledTickets = await TicketModel.countDocuments({ status: 'canceled' });

        res.json({
            totalTickets,
            bookedTickets,
            canceledTickets
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

// Admin Dashboard APIs
app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalFlights = await FlightModel.countDocuments();
        const totalTickets = await TicketModel.countDocuments();
        const totalRevenue = await TicketModel.aggregate([
            { $match: { status: 'booked' } },
            {
                $lookup: {
                    from: 'flights',
                    localField: 'flightId',
                    foreignField: '_id',
                    as: 'flight'
                }
            },
            { $unwind: '$flight' },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$flight.price' }
                }
            }
        ]);
        const totalAnnouncements = await AnnouncementModel.countDocuments();
        const totalUsers = await UserModel.countDocuments();

        res.json({
            totalFlights,
            totalTickets,
            totalRevenue: totalRevenue[0]?.totalRevenue || 0,
            totalAnnouncements,
            totalUsers
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.get('/api/admin/recent-bookings', async (req, res) => {
    try {
        const recentBookings = await TicketModel.find()
            .populate('flightId customerId')
            .sort({ createdAt: -1 })
            .limit(5);
        res.json(recentBookings.map(ticket => new Ticket({
            id: ticket._id,
            customerId: ticket.customerId,
            flightId: ticket.flightId,
            seat: ticket.seat,
            ticketClassId: ticket.ticketClassId,
            additionalServices: ticket.additionalServices,
            status: ticket.status,
            timeline: ticket.timeline,
            createdAt: ticket.createdAt
        })));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.get('/api/admin/upcoming-flights', async (req, res) => {
    try {
        const upcomingFlights = await FlightModel.find()
            .populate('aircraft')
            .where('departureTime').gte(new Date())
            .sort({ departureTime: 1 })
            .limit(5);
        res.json(upcomingFlights.map(flight => new Flight({
            id: flight._id,
            flight_number: flight.flight_number,
            aircraft: flight.aircraft,
            departure: flight.departure,
            destination: flight.destination,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            duration: flight.duration,
            pilot: flight.pilot,
            notes: flight.notes,
            departureImage: flight.departureImage,
            destinationImage: flight.destinationImage,
            destinationInfo: flight.destinationInfo,
            price: flight.price,
            createdAt: flight.createdAt
        })));
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
app.get('/api/admin/booking-trends', async (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        const trends = await TicketModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json(trends);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

app.listen(port, () => console.log(`Backend chạy tại http://localhost:${port}`));