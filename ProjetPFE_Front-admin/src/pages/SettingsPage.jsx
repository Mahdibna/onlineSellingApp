import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Profile from "../components/settings/Profile";
const SettingsPage = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className='flex-1 overflow-auto relative z-10 bg-[#F7F7F7]'>
            <Header title='Admin Profile' />
            <main className='max-w-4xl mx-auto py-6 px-4 lg:px-8'>
                <motion.div
                    className='space-y-6'
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants}>
                        <Profile />
                    </motion.div>
                    
                   
                </motion.div>
            </main>
        </div>
    );
};

export default SettingsPage;
