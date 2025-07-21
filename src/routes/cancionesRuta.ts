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

        //Obtenemos las canciones que usan la misma etiqueta
        if(cancion.etiquetas?.length!>0)
            cancionesEtiqueta = await CancionesRepo.ObtenerCancionesEtiquetas(cancion.etiquetas, cancion.id, cancion.idTipoCancion);
        
        //Obtenemos las canciones que tengan la misma tonica
        const cancionesTonica = await CancionesRepo.ObtenerCancionesTonicaRelativa(cancion.tonica, cancion.id, cancion.idTipoCancion);

        //Obtenemos las canciones relativas
        const relativa = CancionesRepo.ObtenerNotaRelativa(cancion.tonica);
        const cancionesRelativa = relativa
            ? await CancionesRepo.ObtenerCancionesTonicaRelativa(relativa, cancion.id, cancion.idTipoCancion)
            : [];

        const resultado: any[] = [];

        function yaAgregada(idCancion: number): boolean {
            return resultado.some(c => c.idCancion === idCancion);
        }

        // Nivel 1: Coinciden en etiqueta y tonica/relativa
        for (const cancionEtiqueta of cancionesEtiqueta) {
            const coincideTonica = cancionesTonica.find(c => c.idCancion === cancionEtiqueta.idCancion);
            const coincideRelativa = cancionesRelativa.find(c => c.idCancion === cancionEtiqueta.idCancion);

            if (coincideTonica || coincideRelativa) {
                resultado.push({ ...cancionEtiqueta, relacion: 1 });
            } else {
                resultado.push({ ...cancionEtiqueta, relacion: 3 });
            }
        }

        // Nivel 2: Solo tonica o relativa
        for (const cancionTonica of [...cancionesTonica, ...cancionesRelativa]) {
            if (!yaAgregada(cancionTonica.idCancion)) {
                resultado.push({ ...cancionTonica, relacion: 2 });
            }
        }

        //Ordenamos el array por niveles
        resultado.sort((a, b) => a.relacion - b.relacion);

        res.json(resultado)

    } catch(error:any){
        let msg = "Error al obtener los relacionados de la canción.";
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