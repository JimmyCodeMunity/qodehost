const Project = require("../models/ProjectModel");

// Create project
const createProject = async (req, res) => {
  try {
    const { name, description, type, icon, accentColor, link, tags, featured, order } = req.body;
    const project = await Project.create({
      name,
      description,
      type,
      icon: icon || "Globe",
      accentColor: accentColor || "lime",
      link: link || "",
      tags: tags || [],
      featured: featured || false,
      order: order || 0,
    });
    return res.status(201).json({ success: true, message: "Project created", data: project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: 1 });
    return res.status(200).json({ success: true, data: projects });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single project
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, icon, accentColor, link, tags, featured, status, order } = req.body;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (type) project.type = type;
    if (icon) project.icon = icon;
    if (accentColor) project.accentColor = accentColor;
    if (link !== undefined) project.link = link;
    if (tags) project.tags = tags;
    if (featured !== undefined) project.featured = featured;
    if (status) project.status = status;
    if (order !== undefined) project.order = order;
    project.updatedAt = Date.now();

    await project.save();
    return res.status(200).json({ success: true, message: "Project updated", data: project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    return res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
