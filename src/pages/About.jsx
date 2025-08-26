import React from "react";
import {
  FaTint,
  FaUsers,
  FaHeart,
  FaHospital,
  FaCode,
  FaDatabase,
  FaMobile,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

const About = () => {
  const teamMembers = [
    {
      name: "Equipe HemoByte",
      role: "Desenvolvedores",
      description:
        "Equipe dedicada ao desenvolvimento de soluções tecnológicas para saúde",
    },
  ];

  const technologies = [
    {
      name: "React",
      icon: FaCode,
      description: "Frontend moderno e responsivo",
    },
    {
      name: "Node.js",
      icon: FaDatabase,
      description: "Backend robusto e escalável",
    },
    {
      name: "Mobile App",
      icon: FaMobile,
      description: "Aplicativo nativo para iOS e Android",
    },
    {
      name: "Web Platform",
      icon: FaGlobe,
      description: "Plataforma web acessível",
    },
  ];

  const partners = [
    {
      name: "Hospitais Locais",
      description: "Parceria com hospitais da região de Feira de Santana",
    },
    {
      name: "Hemocentros",
      description: "Colaboração com hemocentros estaduais",
    },
    {
      name: "Universidades",
      description: "Parceria com instituições de ensino superior",
    },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary-800 mb-4">
            Sobre o HemoByte
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Uma plataforma inovadora que conecta doadores de sangue com
            campanhas de doação em Feira de Santana
          </p>
        </div>

        {/* Project Section */}
        <section className="mb-16">
          <div className="card-custom p-8">
            <h2 className="text-3xl font-bold text-secondary-800 mb-6">
              O Projeto
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-lg text-secondary-600 mb-4">
                  O HemoByte nasceu da necessidade de modernizar e otimizar o
                  processo de doação de sangue em Feira de Santana. Nossa missão
                  é conectar doadores voluntários com campanhas de doação de
                  forma eficiente e transparente.
                </p>
                <p className="text-lg text-secondary-600 mb-4">
                  Através de nossa plataforma, facilitamos a comunicação entre
                  hemocentros, hospitais e doadores, garantindo que o sangue
                  necessário esteja sempre disponível quando mais precisar.
                </p>
                <p className="text-lg text-secondary-600">
                  Utilizamos tecnologia de ponta para criar uma experiência
                  intuitiva e acessível, promovendo a cultura de doação de
                  sangue e salvando vidas em nossa comunidade.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-64 h-64 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <FaTint className="text-8xl text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission and Vision */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-custom p-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <FaHeart className="text-2xl text-primary-500" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-800 mb-4">
                Nossa Missão
              </h3>
              <p className="text-secondary-600">
                Conectar doadores de sangue com campanhas de doação de forma
                eficiente, promovendo a solidariedade e garantindo o
                abastecimento de sangue nos hospitais da região.
              </p>
            </div>

            <div className="card-custom p-8">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mb-6">
                <FaUsers className="text-2xl text-accent-500" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-800 mb-4">
                Nossa Visão
              </h3>
              <p className="text-secondary-600">
                Ser a principal plataforma de doação de sangue do Brasil,
                expandindo para outras cidades e salvando milhares de vidas
                através da tecnologia.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-secondary-800 text-center mb-8">
            Nossa Equipe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="card-custom p-6 text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="text-2xl text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                  {member.name}
                </h3>
                <p className="text-primary-500 font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-secondary-600">{member.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technologies Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-secondary-800 text-center mb-8">
            Tecnologias Utilizadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologies.map((tech, index) => (
              <div key={index} className="card-custom p-6 text-center">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <tech.icon className="text-2xl text-secondary-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                  {tech.name}
                </h3>
                <p className="text-secondary-600 text-sm">{tech.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partnerships Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-secondary-800 text-center mb-8">
            Nossas Parcerias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partners.map((partner, index) => (
              <div key={index} className="card-custom p-6 text-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHospital className="text-2xl text-success-500" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                  {partner.name}
                </h3>
                <p className="text-secondary-600">{partner.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <div className="card-custom p-8">
            <h2 className="text-3xl font-bold text-secondary-800 text-center mb-8">
              Entre em Contato
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPhone className="text-2xl text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                  Telefone
                </h3>
                <p className="text-secondary-600">(75) 98182-9675</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaEnvelope className="text-2xl text-accent-500" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                  Email
                </h3>
                <p className="text-secondary-600">hemobytess@gmail.com</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaMapMarkerAlt className="text-2xl text-success-500" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                  Localização
                </h3>
                <p className="text-secondary-600">Feira de Santana, BA</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
