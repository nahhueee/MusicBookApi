import {MiscRepo} from '../data/miscRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
const router : Router  = Router();


//#region OBTENER
router.get('/tipo-cancion', async (req:Request, res:Response) => {
    try{ 
        res.json(await MiscRepo.TipoCancionSelector());

    } catch(error:any){
        let msg = "Error al obtener el listado de tipos de canciones.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.get('/tipo-seccion', async (req:Request, res:Response) => {
    try{ 
        res.json(await MiscRepo.TipoSeccionSelector());

    } catch(error:any){
        let msg = "Error al obtener el listado de tipos de secciones.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

// Export the router
export default router; 