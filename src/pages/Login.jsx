import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import { FaTint, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";

const Login = () => {
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm();

  const onSubmitLogin = async (data) => {
    setIsLoading(true);
    try {
      const success = await login(data.email, data.senha);
      if (success) {
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitRegister = async (data) => {
    if (data.senha !== data.confirmar_senha) {
      alert("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    try {
      const success = await registerUser(data);
      if (success) {
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 text-primary-500 mb-8"
          >
            <FaTint className="text-4xl" />
            <span className="text-3xl font-bold">HemoByte</span>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="card-custom p-8">
          {/* Tabs */}
          <div className="flex mb-8">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 px-4 text-center font-semibold transition-colors duration-300 ${
                activeTab === "login"
                  ? "text-primary-500 border-b-2 border-primary-500"
                  : "text-secondary-500 hover:text-secondary-700"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-3 px-4 text-center font-semibold transition-colors duration-300 ${
                activeTab === "register"
                  ? "text-primary-500 border-b-2 border-primary-500"
                  : "text-secondary-500 hover:text-secondary-700"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleSubmit(onSubmitLogin)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Email é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido",
                    },
                  })}
                  className="input-custom"
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="senha"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    {...register("senha", {
                      required: "Senha é obrigatória",
                      minLength: {
                        value: 6,
                        message: "Senha deve ter pelo menos 6 caracteres",
                      },
                    })}
                    className="input-custom pr-12"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.senha.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <span className="ml-2 text-sm text-secondary-600">
                    Lembrar de mim
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary-custom w-full flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form
              onSubmit={handleSubmit(onSubmitRegister)}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  Nome Completo
                </label>
                <input
                  id="nome"
                  type="text"
                  {...register("nome", {
                    required: "Nome é obrigatório",
                    minLength: {
                      value: 2,
                      message: "Nome deve ter pelo menos 2 caracteres",
                    },
                  })}
                  className="input-custom"
                  placeholder="Seu nome completo"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.nome.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email_register"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email_register"
                  type="email"
                  {...register("email", {
                    required: "Email é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido",
                    },
                  })}
                  className="input-custom"
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="telefone"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  Telefone
                </label>
                <input
                  id="telefone"
                  type="tel"
                  {...register("telefone", {
                    required: "Telefone é obrigatório"
                  })}
                  className="input-custom"
                  placeholder="(75) 99999-9999"
                />
                {errors.telefone && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.telefone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="senha_register"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="senha_register"
                    type={showPassword ? "text" : "password"}
                    {...register("senha", {
                      required: "Senha é obrigatória",
                      minLength: {
                        value: 6,
                        message: "Senha deve ter pelo menos 6 caracteres",
                      },
                    })}
                    className="input-custom pr-12"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.senha.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmar_senha"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  Confirmar Senha
                </label>
                <input
                  id="confirmar_senha"
                  type="password"
                  {...register("confirmar_senha", {
                    required: "Confirmação de senha é obrigatória",
                    validate: (value) =>
                      value === watch("senha") || "As senhas não coincidem",
                  })}
                  className="input-custom"
                  placeholder="Confirme sua senha"
                />
                {errors.confirmar_senha && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.confirmar_senha.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary-custom w-full flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </button>
            </form>
          )}

          {/* Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              {activeTab === "login"
                ? "Não tem uma conta?"
                : "Já tem uma conta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === "login" ? "register" : "login");
                  reset();
                }}
                className="text-primary-500 hover:text-primary-600 font-semibold"
              >
                {activeTab === "login" ? "Cadastre-se" : "Faça login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;