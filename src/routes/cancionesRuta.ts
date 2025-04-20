import {CancionesRepo} from '../data/cancionesRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
const router : Router  = Router();

//#region OBTENER
router.post('/obtener', async (req:Request, res:Response) => {
    try{ 
        res.json(await CancionesRepo.Obtener(req.body));

    } catch(error:any){
        let msg = "Error al obtener el listado de canciones.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.get('/obtener-una/:id', async (req:Request, res:Response) => {
    try{ 
        res.json(await CancionesRepo.ObtenerCancion(req.params.id));

    } catch(error:any){
        let msg = "Error al obtener la canción nro: " + req.params.id;
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.post('/validar', async (req:Request, res:Response) => {
    try{ 
        res.json(await CancionesRepo.ValidarExistencia(req.body));

    } catch(error:any){
        let msg = "Error al intentar validar una canción.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.get('/etiquetas', async (req:Request, res:Response) => {
    try{ 
        res.json(await CancionesRepo.ObtenerEtiquetas());

    } catch(error:any){
        let msg = "Error al obtener el selector de etiquetas.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

//#region ABM
router.post('/agregar', async (req:Request, res:Response) => {
    try{ 
        res.json(await CancionesRepo.Agregar(req.body));

    } catch(error:any){
        let msg = "Error al intentar agregar la canción.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.put('/modificar', async (req:Request, res:Response) => {
    try{ 
        res.json(await CancionesRepo.Modificar(req.body));

    } catch(error:any){
        let msg = "Error al intentar modificar la categoria.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.delete('/eliminar/:id', async (req:Request, res:Response) => {
    try{ 
        res.json(await CancionesRepo.Eliminar(req.params.id));

    } catch(error:any){
        let msg = "Error al intentar eliminar la cancion.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

// Export the router
export default router; 