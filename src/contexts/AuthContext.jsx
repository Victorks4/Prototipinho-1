import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// Configurar base URL do axios
const api = axios.create({
  baseURL: 'http://localhost/Prototipinho-1/hemobyte.api/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});
//comita bosta
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        // Configurar token no header para futuras requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (error) {
        console.error("Erro ao carregar usuário do localStorage:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await api.post('/login.php', {
        email,
        senha
      });

      if (response.data.success) {
        const userData = response.data.user;
        const token = response.data.token;
        
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        
        // Configurar token para futuras requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        toast.success(response.data.message || "Login realizado com sucesso!");
        return true;
      } else {
        toast.error(response.data.message || "Erro ao fazer login");
        return false;
      }
    } catch (error) {
      console.error("Erro no login:", error);
      
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Erro ao fazer login");
      } else {
        toast.error("Erro ao conectar com o servidor");
      }
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/register.php', userData);

      if (response.data.success) {
        const newUser = response.data.user;
        const token = response.data.token;
        
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("token", token);
        
        // Configurar token para futuras requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        toast.success(response.data.message || "Cadastro realizado com sucesso!");
        return true;
      } else {
        toast.error(response.data.message || "Erro ao cadastrar");
        return false;
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Erro ao cadastrar");
      } else {
        toast.error("Erro ao conectar com o servidor");
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // Remover token do header
    delete api.defaults.headers.common['Authorization'];
    
    toast.success("Logout realizado com sucesso!");
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};