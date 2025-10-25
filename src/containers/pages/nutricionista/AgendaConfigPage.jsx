// Importa los componentes de configuración que ya hemos creado
import UbicacionListEdit from '../../../features/agenda/components/Nutricionista/UbicacionListEdit';
import TipoConsultaListEdit from '../nutricionista/TipoConsultaListEdit';
import DisponibilidadListEdit from '../../../features/agenda/components/Nutricionista/DisponibilidadListEdit';
import BloqueoListEdit from '../../../features/agenda/components/Nutricionista/BloqueoListEdit';
import ProfessionalSettingsEdit from '../../../features/agenda/components/Nutricionista/ProfessionalSettingsEdit'; 

const AgendaConfigPage = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen"> {/* Fondo gris claro */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Configuración de Agenda</h1>

      <div className="space-y-10"> {/* Aumentar espacio entre secciones */}


        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Ajustes Generales</h2>
            <ProfessionalSettingsEdit />
          </div>
        </div>

        {/* Sección para Ubicaciones */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden"> {/* Sombra más pronunciada */}
          <div className="p-6"> {/* Padding interno */}
            {/* El componente UbicacionListEdit ya tiene su propio título h3 */}
            <UbicacionListEdit />
          </div>
        </div>

        {/* Sección para Tipos de Consulta */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
             {/* El componente TipoConsultaListEdit ya tiene su propio título h3 */}
            <TipoConsultaListEdit />
          </div>
        </div>

        {/* Sección para Disponibilidad Horaria (Descomentar cuando se cree el componente) */}
        
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <DisponibilidadListEdit />
          </div>
        </div>
    

        {/* Sección para Bloqueos (Descomentar cuando se cree el componente) */}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <BloqueoListEdit />
          </div>
        </div>


      </div>
    </div>
  );
};

export default AgendaConfigPage;