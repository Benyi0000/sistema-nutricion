import Navbar from "../../components/navigation/Navbar";
import Layout from "../../hocs/layouts/Layout";
import Footer from "../../components/navigation/Footer";

function Home() {
    return (
        <Layout>
        <Navbar />
        <div className="pt-28 min-h-screen">
            home
        </div>
        <Footer />
        </Layout>
    )
    }
export default Home;
