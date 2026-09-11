const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const BloodRequest = require('./models/BloodRequest');
const Hospital = require('./models/Hospital');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lifedrop';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Clearing existing collections...');

    await User.deleteMany({});
    await BloodRequest.deleteMany({});
    await Hospital.deleteMany({});

    console.log('Inserting seed users...');

    // 1. Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@lifedrop.org',
      password: 'Admin@123',
      phone: '+1 800-555-0199',
      bloodGroup: 'O+',
      age: 38,
      gender: 'Male',
      city: 'Chicago',
      state: 'Illinois',
      role: 'admin',
      availability: 'Not Available',
    });

    // 2. Hospitals
    const hospital1 = await User.create({
      name: 'Dr. Robert Vance (Director)',
      email: 'cityhospital@lifedrop.org',
      password: 'Hospital@123',
      phone: '+1 312-555-0144',
      bloodGroup: 'A+',
      age: 49,
      gender: 'Male',
      city: 'Chicago',
      state: 'Illinois',
      role: 'hospital',
      hospitalName: 'Chicago Metropolitan General Hospital',
      availability: 'Not Available',
    });

    await Hospital.create({
      name: 'Chicago Metropolitan General Hospital',
      email: 'cityhospital@lifedrop.org',
      phone: '+1 312-555-0144',
      emergencyHotline: '+1 312-555-0191',
      address: '742 South Michigan Avenue',
      city: 'Chicago',
      state: 'Illinois',
      licenseNumber: 'IL-HOSP-98442',
      associatedUser: hospital1._id,
    });

    const hospital2 = await User.create({
      name: 'Dr. Elena Rostova (Emergency Chief)',
      email: 'apollo@lifedrop.org',
      password: 'Hospital@123',
      phone: '+1 212-555-0188',
      bloodGroup: 'O-',
      age: 44,
      gender: 'Female',
      city: 'New York',
      state: 'New York',
      role: 'hospital',
      hospitalName: 'St. Jude Memorial Trauma Center',
      availability: 'Not Available',
    });

    await Hospital.create({
      name: 'St. Jude Memorial Trauma Center',
      email: 'apollo@lifedrop.org',
      phone: '+1 212-555-0188',
      emergencyHotline: '+1 212-555-0100',
      address: '450 East 29th Street',
      city: 'New York',
      state: 'New York',
      licenseNumber: 'NY-MED-55120',
      associatedUser: hospital2._id,
    });

    // 3. Patients
    const patient1 = await User.create({
      name: 'David Miller',
      email: 'patient@lifedrop.org',
      password: 'Patient@123',
      phone: '+1 312-555-0167',
      bloodGroup: 'O-',
      age: 32,
      gender: 'Male',
      city: 'Chicago',
      state: 'Illinois',
      role: 'patient',
      availability: 'Not Available',
    });

    const patient2 = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah@lifedrop.org',
      password: 'Patient@123',
      phone: '+1 212-555-0155',
      bloodGroup: 'B+',
      age: 28,
      gender: 'Female',
      city: 'New York',
      state: 'New York',
      role: 'patient',
      availability: 'Not Available',
    });

    // 4. Donors (Across multiple blood groups and cities)
    const donorsData = [
      {
        name: 'Alexander Hayes',
        email: 'alex.hayes@example.com',
        password: 'Donor@123',
        phone: '+1 312-555-0111',
        bloodGroup: 'O-', // Universal Donor!
        age: 29,
        gender: 'Male',
        city: 'Chicago',
        state: 'Illinois',
        role: 'donor',
        availability: 'Available',
        lastDonationDate: new Date('2026-06-15'),
      },
      {
        name: 'Emily Watson',
        email: 'emily.w@example.com',
        password: 'Donor@123',
        phone: '+1 312-555-0122',
        bloodGroup: 'A+',
        age: 26,
        gender: 'Female',
        city: 'Chicago',
        state: 'Illinois',
        role: 'donor',
        availability: 'Available',
        lastDonationDate: new Date('2026-05-20'),
      },
      {
        name: 'Marcus Chen',
        email: 'marcus.chen@example.com',
        password: 'Donor@123',
        phone: '+1 212-555-0133',
        bloodGroup: 'B+',
        age: 34,
        gender: 'Male',
        city: 'New York',
        state: 'New York',
        role: 'donor',
        availability: 'Available',
        lastDonationDate: new Date('2026-07-02'),
      },
      {
        name: 'Jessica Taylor',
        email: 'jessica.t@example.com',
        password: 'Donor@123',
        phone: '+1 212-555-0145',
        bloodGroup: 'AB+', // Universal Recipient
        age: 31,
        gender: 'Female',
        city: 'New York',
        state: 'New York',
        role: 'donor',
        availability: 'Available',
        lastDonationDate: new Date('2026-04-10'),
      },
      {
        name: 'Dr. Rajesh Patel',
        email: 'rajesh.patel@example.com',
        password: 'Donor@123',
        phone: '+1 713-555-0166',
        bloodGroup: 'O+',
        age: 41,
        gender: 'Male',
        city: 'Houston',
        state: 'Texas',
        role: 'donor',
        availability: 'Available',
        lastDonationDate: new Date('2026-07-22'),
      },
      {
        name: 'Sofia Rodriguez',
        email: 'sofia.r@example.com',
        password: 'Donor@123',
        phone: '+1 310-555-0177',
        bloodGroup: 'A-',
        age: 27,
        gender: 'Female',
        city: 'Los Angeles',
        state: 'California',
        role: 'donor',
        availability: 'Available',
        lastDonationDate: new Date('2026-06-01'),
      },
      {
        name: 'James Wilson',
        email: 'james.w@example.com',
        password: 'Donor@123',
        phone: '+1 310-555-0189',
        bloodGroup: 'O+',
        age: 35,
        gender: 'Male',
        city: 'Los Angeles',
        state: 'California',
        role: 'donor',
        availability: 'Not Available',
        lastDonationDate: new Date('2026-08-25'),
      },
      {
        name: 'Chloe Bennett',
        email: 'chloe.b@example.com',
        password: 'Donor@123',
        phone: '+1 602-555-0192',
        bloodGroup: 'B-',
        age: 24,
        gender: 'Female',
        city: 'Phoenix',
        state: 'Arizona',
        role: 'donor',
        availability: 'Available',
        lastDonationDate: new Date('2026-05-18'),
      },
      {
        name: 'Lucas Morales',
        email: 'lucas.m@example.com',
        password: 'Donor@123',
        phone: '+1 713-555-0198',
        bloodGroup: 'AB-',
        age: 33,
        gender: 'Male',
        city: 'Houston',
        state: 'Texas',
        role: 'donor',
        availability: 'Available',
        lastDonationDate: new Date('2026-06-30'),
      },
      {
        name: 'Olivia Martinez',
        email: 'olivia.m@example.com',
        password: 'Donor@123',
        phone: '+1 312-555-0199',
        bloodGroup: 'O-',
        age: 28,
        gender: 'Female',
        city: 'Chicago',
        state: 'Illinois',
        role: 'donor',
        availability: 'Available',
        lastDonationDate: new Date('2026-07-14'),
      },
    ];

    for (const donor of donorsData) {
      await User.create(donor);
    }
    console.log(`Created 10 sample blood donors.`);

    // 5. Sample Emergency Blood Requests
    const sampleRequests = [
      {
        patientName: 'Emma Richardson (Emergency ICU)',
        bloodGroup: 'O-',
        hospitalName: 'Chicago Metropolitan General Hospital',
        city: 'Chicago',
        requiredUnits: 3,
        emergencyLevel: 'Critical',
        contactNumber: '+1 312-555-0191',
        status: 'Active',
        notes: 'Road traffic collision casualty, undergoing emergency thoracic surgery. Immediate O- units required.',
        requestedBy: hospital1._id,
        createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
      },
      {
        patientName: 'Anthony Brooks',
        bloodGroup: 'A+',
        hospitalName: 'St. Jude Memorial Trauma Center',
        city: 'New York',
        requiredUnits: 2,
        emergencyLevel: 'Critical',
        contactNumber: '+1 212-555-0100',
        status: 'Active',
        notes: 'Severe acute hemorrhage, urgent platelet and whole blood units needed within the hour.',
        requestedBy: hospital2._id,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        patientName: 'Claire Cooper',
        bloodGroup: 'B+',
        hospitalName: 'Chicago Metropolitan General Hospital',
        city: 'Chicago',
        requiredUnits: 2,
        emergencyLevel: 'High',
        contactNumber: '+1 312-555-0144',
        status: 'Active',
        notes: 'Scheduled cardiovascular bypass procedure requiring dedicated reserve units.',
        requestedBy: hospital1._id,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
      {
        patientName: 'David Miller (Self/Family)',
        bloodGroup: 'O-',
        hospitalName: 'Northwestern Memorial Clinic',
        city: 'Chicago',
        requiredUnits: 1,
        emergencyLevel: 'Medium',
        contactNumber: '+1 312-555-0167',
        status: 'Active',
        notes: 'Ongoing chemotherapy support requiring RBC replenishment.',
        requestedBy: patient1._id,
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
      },
      {
        patientName: 'Hannah Foster',
        bloodGroup: 'AB+',
        hospitalName: 'Houston Methodist Specialty Hospital',
        city: 'Houston',
        requiredUnits: 2,
        emergencyLevel: 'High',
        contactNumber: '+1 713-555-0190',
        status: 'Fulfilled',
        notes: 'Emergency cesarean delivery transfusion. Transfusion completed successfully!',
        createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000), // yesterday
      },
      {
        patientName: 'Liam Murphy',
        bloodGroup: 'O+',
        hospitalName: 'Cedars-Sinai Medical Center',
        city: 'Los Angeles',
        requiredUnits: 4,
        emergencyLevel: 'Medium',
        contactNumber: '+1 310-555-0150',
        status: 'Active',
        notes: 'Orthopedic reconstruction post-accident.',
        createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000),
      },
    ];

    for (const reqData of sampleRequests) {
      await BloodRequest.create(reqData);
    }
    console.log(`Created ${sampleRequests.length} sample emergency requests.`);

    console.log('=====================================================');
    console.log('  Database seeding completed successfully!');
    console.log('=====================================================');
    console.log('Test Accounts available:');
    console.log('  Admin:    admin@lifedrop.org        / Admin@123');
    console.log('  Hospital: cityhospital@lifedrop.org / Hospital@123');
    console.log('  Hospital: apollo@lifedrop.org       / Hospital@123');
    console.log('  Donor:    alex.hayes@example.com    / Donor@123 (O- Universal)');
    console.log('  Donor:    emily.w@example.com       / Donor@123 (A+)');
    console.log('  Patient:  patient@lifedrop.org      / Patient@123');
    console.log('=====================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
