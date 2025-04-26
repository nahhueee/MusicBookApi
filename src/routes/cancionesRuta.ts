import {CancionesRepo} from '../data/cancionesRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
import { Cancion } from '../models/Cancion';
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

router.get('/relacionados/:cancion', async (req:Request, res:Response) => {
    try{ 
        let cancion = await CancionesRepo.ObtenerCancion(req.params.cancion);
        
        let cancionesEtiqueta:any[] = [];
        if(cancion.etiquetas?.length!>0)
            cancionesEtiqueta = await CancionesRepo.ObtenerCancionesEtiquetas(cancion.etiquetas, cancion.id, cancion.idTipoCancion);
        
        const cancionesTonica = await CancionesRepo.ObtenerCancionesTonica(cancion.tonica, cancion.id, cancion.idTipoCancion);

        // Asigná nivel 1 a las que están en ambas listas.
        // Asigná nivel 2 a las que están solo en cancionesTonica.
        // Asigná nivel 3 a las que están solo en cancionesEtiqueta.

        const resultado: any[] = [];

        // Primero canciones que coinciden en etiquetas
        for (const cancionEtiqueta of cancionesEtiqueta) {
        const matchInTonica = cancionesTonica.find(c => c.idCancion === cancionEtiqueta.idCancion);
        if (matchInTonica) {
            // Coincide en ambas → nivel 1
            resultado.push({ ...cancionEtiqueta, relacion: 1 });
        } else {
            // Solo etiqueta → nivel 3
            resultado.push({ ...cancionEtiqueta, relacion: 3 });
        }
        }

        // Luego canciones que solo coinciden en tónica y no fueron agregadas antes
        for (const cancionTonica of cancionesTonica) {
        const yaAgregada = resultado.find(c => c.idCancion === cancionTonica.idCancion);
        if (!yaAgregada) {
            // Solo tonica → nivel 2
            resultado.push({ ...cancionTonica, relacion: 2 });
        }
        }

        //Ordenamos el array por niveles
        resultado.sort((a, b) => a.relacion - b.relacion);

        res.json(resultado)

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