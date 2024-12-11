import React from 'react';
import { AuthService } from '../services/AuthService';

const Dashboard: React.FC = () => (
  <div>
    <h1>Welcome to the Dashboard!</h1>
    <button onClick={() => AuthService.logout()}>Logout</button>
  </div>
);

export default Dashboard;
