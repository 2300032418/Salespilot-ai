import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'Lalith Pavan',
    email: 'lalith.pavan@salespilot.ai',
    role: 'Founder & Full Stack Developer',
    avatar: 'LP',
  });

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
