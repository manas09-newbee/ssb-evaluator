const ppdtServices = require("./ppdt.services");
const PPDTReport = require("../../models/PPDTReport"); // Import PPDTReport model

const BASE_URL =
  process.env.BASE_URL ||
  `http://localhost:${process.env.PORT || 5000}`;

const evaluateStory = async (req, res) => {
  try {
    const { image, userId, piqId, imageUrl, pictureId, attemptNumber } = req.body;
    if (!image) {
      return res.status(400).json({
        message: "Handwritten story image is required."
      });
    }

    // 1. Get AI evaluation result from Gemini
    const result = await ppdtServices.evaluateHandwrittenStory(image);

    // 2. Save the evaluation details to MongoDB if we have candidate context
    if (userId && piqId) {
      const newReport = new PPDTReport({
        user: userId,
        piq: piqId,
        imageUrl: imageUrl || `${BASE_URL}/ppdt_images/temp_${Date.now()}.png`, 
        extractedText: result.transcription || "",
        handwrittenStory: result.transcription || "",
        evaluation: {
          aiEvaluation: result.evaluation?.aiEvaluation || "Evaluation complete",
          narration: result.evaluation?.narration || "",
          imagination: result.evaluation?.imagination || "",
          positivity: result.evaluation?.positivity || "",
          officerLikeQualities: result.evaluation?.officerLikeQualities || "",
          recommendations: result.evaluation?.recommendations || ""
        },
        olqScores: {
          effectiveIntelligence: result.olqScores?.effectiveIntelligence || 0,
          reasoning: result.olqScores?.reasoning || 0,
          initiative: result.olqScores?.initiative || 0,
          leadership: result.olqScores?.leadership || 0,
          cooperation: result.olqScores?.cooperation || 0,
          communication: result.olqScores?.communication || 0,
          responsibility: result.olqScores?.responsibility || 0,
          selfConfidence: result.olqScores?.selfConfidence || 0
        },
        pictureId: pictureId || "unknown_picture",
        attemptNumber: attemptNumber || 1
      });

      await newReport.save();

      // 3. Immediately clean up/strip the image URL string from MongoDB to conserve storage [1]
      await PPDTReport.cleanupUserPPDT(userId, false); 
      console.log(`[Database Cleanup] Stripped PPDT image reference for user: ${userId}`);
    }

    // 4. Return the parsed object directly to the client
    res.json(result);
  } catch (error) {
    console.error("PPDT Controller Error:", error);
    res.status(500).json({
      message: "Failed to process PPDT evaluation."
    });
  }
};

const getPpdtImages = (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const dirPath = path.join(__dirname, "../../public/ppdt_images");

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const files = fs.readdirSync(dirPath);
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    
    const images = files
      .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
      .map((file, index) => {
        const baseName = path.basename(file, path.extname(file));
        const formattedTitle = baseName
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, char => char.toUpperCase());

        return {
          id: `local_${index}`,
          title: `Scenario: ${formattedTitle}`,
          url: `${BASE_URL}/ppdt_images/${file}`,
          description: `Custom local user image file: ${file}`
        };
      });

    if (images.length === 0) {
      const defaultImages = [
        {
          id: "default_1",
          title: "Scenario 1: Village Gathering (Panchayat / Community Initiative)",
          url: "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=500&auto=format&fit=crop",
          description: "Default fallback sketch representing a rural village discussion."
        },
        {
          id: "default_2",
          title: "Scenario 2: The Thoughtful Scholar (Academic / Personal Crisis)",
          url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=500&auto=format&fit=crop",
          description: "Default fallback sketch of an individual studying under a lamp."
        },
        {
          id: "default_3",
          title: "Scenario 3: Rescue / Flooded River Crossing (Disaster Relief)",
          url: "https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?q=80&w=500&auto=format&fit=crop",
          description: "Default fallback sketch suggesting an emergency river crossing."
        },
        {
          id: "default_4",
          title: "Scenario 4: Team Construction / Cooperative Farm (Teamwork / GTO)",
          url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=500&auto=format&fit=crop",
          description: "Default fallback sketch depicting people collaborating on manual labor."
        }
      ];
      return res.json(defaultImages);
    }

    res.json(images);
  } catch (error) {
    console.error("Failed to read dynamic PPDT directory:", error);
    res.status(500).json({ message: "Failed to scan PPDT image directory" });
  }
};

module.exports = {
  evaluateStory,
  getPpdtImages
};