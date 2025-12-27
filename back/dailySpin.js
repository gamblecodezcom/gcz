router.get("/eligibility", controller.checkEligibility);
router.post("/", controller.spinWheel);

module.exports = router;
