import {ListasRepo} from '../data/listasRepository';
import {CancionesRepo} from '../data/cancionesRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
import { Lista } from '../models/Lista';
const router : Router  = Router();


//#region OBTENER
router.get('/obtener', async (req:Request, res:Response) => {
    try{ 
        res.json(await ListasRepo.ObtenerListas(null));

    } catch(error:any){
        let msg = "Error al obtener el listado de listas.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.get('/obtener-una/:id', async (req:Request, res:Response) => {
    try{ 
        const respuesta = await ListasRepo.ObtenerListas(req.params.id);
        res.json(respuesta[0]);

    } catch(error:any){
        let msg = "Error al obtener la lista nro: " + req.params.id;
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

//#region ABM
router.post('/agregar', async (req:Request, res:Response) => {
    try{ 
        res.json(await ListasRepo.Agregar(req.body));

    } catch(error:any){
        let msg = "Error al intentar agregar la lista de canciones.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.put('/modificar', async (req:Request, res:Response) => {
    try{ 
        res.json(await ListasRepo.Modificar(req.body));

    } catch(error:any){
        let msg = "Error al intentar modificar la lista de canciones.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.delete('/eliminar/:id', async (req:Request, res:Response) => {
    try{ 
        res.json(await ListasRepo.Eliminar(req.params.id));

    } catch(error:any){
        let msg = "Error al intentar eliminar la lista.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.post('/agregar-cancion', async (req:Request, res:Response) => {
    try{ 
        res.json(await ListasRepo.InsertCancion(req.body));

    } catch(error:any){
        let msg = "Error al intentar agregar una canción a la lista de canciones.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
router.put('/eliminar-cancion', async (req:Request, res:Response) => {
    try{ 
        res.json(await ListasRepo.DeleteCancion(req.body));

    } catch(error:any){
        let msg = "Error al intentar eliminar una canción de la lista.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

// Export the router
export default router; 