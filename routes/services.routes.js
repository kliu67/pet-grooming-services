import express from "express";
import * as Service from "../models/service.model.js";
import { isNumbersOnly, isValidEmail, isValidId, isValidPrice } from "../utils/helpers.js";
import { validateServiceInput } from "../validators/service.validator.js";
const PSQL_ERRORS = {
    UNIQUE_VIOLATION: {
        CODE: '23505',
    },
}

const router = express.Router();

router.get("/", async (req, res) => {
    const services = await Services.findAll();
    res.json(services);
});

router.get("/:id", async (req, res) => {
    try {
        const id = validateNumericId(req.params.id);
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ error: "service not found" });
        res.json(service);
    }

    catch (err) {
        if (!id) {
            return res.status(400).json({ error: "id is invalid" });
        }
        console.log(err);
    }
})

router.post("/", async (req, res) => {
    try {
        validateServiceInput(req.body);
        const service = await Service.create(req.body);
        res.status(201).join(service);
    }

    catch (err) {
        if (err.details) {
            return res.status(400).json({ errors: err.details });
        }
        else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
})

router.put("/", async (req, res) => {
    if (!id) {
        return res.status(400).json({ error: "id is invalid" });
    }
    try {
        const id = validateNumericId(req.params.id);
        validateServiceInput(req.body);
        const service = await Service.update(id, req.body);
        res.status(201).join(service);
    }

    catch (err) {
        if (!id) {
            return res.status(400).json({ error: "id is invalid" });
        }
        if (err.message) res.status(400).json({ error: err.message });
        else res.status(500).json({ error: "Internal server error" });
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const id = validateNumericId(req.params.id);
        const ok = await Service.remove(id);
        if (!ok) {
            res.status(404).json({ error: "Not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    }

    catch (err) {
        if (!id) {
            return res.status(400).json({ error: "id is invalid" });
        }
        console.log(err);
        res.status(400).json({ error: `Invalid request: ${err?.message}` });
    }

});

export default router;