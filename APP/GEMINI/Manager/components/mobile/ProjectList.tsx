import React from 'react';
import type { Project } from '../../types/manager';
import ProjectCard from './ProjectCard';
import { ChartBarIcon } from '../icons/Icons';

interface ProjectListProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onProjectClick }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-800 rounded-lg shadow-md">
        <ChartBarIcon className="mx-auto h-12 w-12 text-slate-500" />
        <h3 className="mt-2 text-lg font-medium text-white">Нет проектов</h3>
        <p className="mt-1 text-sm text-slate-400">Создайте первый проект</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onTap={() => onProjectClick(project)}
        />
      ))}
    </div>
  );
};

export default ProjectList;
