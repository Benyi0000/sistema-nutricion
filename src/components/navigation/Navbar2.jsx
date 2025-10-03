import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import logo from '../../assets/img/logo.png'

function Navbar() {
    return(
        <nav className='w-full py-10 shadow-md fixed'>
            <div className=" bg-white px-4 sm:px-6">
            <div className="-ml-4 -mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap md:px-14 px">
                <div className="ml-4 mt-2">
                <img src= {logo} width={80} height={80}/>
                
                </div>
                <div className="ml-4 mt-2 flex-shrink-0">
                <Link to="/caso"  className="text-lg inline-flex font-medium leading-6 text-gray-900 mx-4">Inicio</Link>
                <Link to="/caso" className="text-lg inline-flex font-medium leading-6 text-gray-900 mx-4">Planes</Link>
                <Link to="/Nosotros" className="text-lg inline-flex font-medium leading-6 text-gray-900 mx-4">Nosotros</Link>
                
                <button
                    type="button"
                    className="ml-12 relative inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Ingresar
                </button>
                </div>
            </div>
            </div>
        </nav>
        )    
}

    const mapStateToProps = () => ({ });
    

    export default connect(mapStateToProps,{
    })(Navbar);