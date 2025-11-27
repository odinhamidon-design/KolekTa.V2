// Shared mock users storage
const mockUsers = [
  {
    _id: '1',
    username: 'admin',
    email: 'admin@kolekta.com',
    password: 'admin123',
    role: 'admin',
    fullName: 'System Administrator',
    isActive: true,
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue'
  },
  {
    _id: '2',
    username: 'driver1',
    email: 'driver1@kolekta.com',
    password: 'driver123',
    role: 'driver',
    fullName: 'Juan Dela Cruz',
    phoneNumber: '09123456789',
    isActive: true,
    faceDescriptor: null,
    securityQuestion: 'What is your mother\'s maiden name?',
    securityAnswer: 'santos'
  },
  {
    _id: '3',
    username: 'driver',
    email: 'driver@kolekta.com',
    password: '123',
    role: 'driver',
    fullName: 'Test Driver',
    phoneNumber: '09111111111',
    isActive: true,
    faceDescriptor: null,
    securityQuestion: 'What is your pet\'s name?',
    securityAnswer: 'brownie'
  }
];

module.exports = mockUsers;
