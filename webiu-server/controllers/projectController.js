exports.getAllProjects = async (req, res) => {
  try {
    res.status(200).json({ mess: 'Success' });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};
