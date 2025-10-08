import React from 'react';
import type { Project } from '../../types/manager';
import { StatusBadge } from '../manager/StatusBadge';
import { FileIcon, LinkIcon } from '../icons/Icons';

interface ProjectCardProps {
  project: Project;
  onTap: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onTap }) => {
  const isOverdue = new Date(project.deadline) < new Date() && 
                    project.status !== 'завершено' && 
                    project.status !== 'архив';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${date.getFullYear()}`;
  };

  const hasAttachments = project.attachments && project.attachments.length > 0;
  const fileCount = project.attachments?.filter(att => att.directus_files_id).length || 0;
  const linkCount = project.attachments?.filter(att => att.url).length || 0;

  return (
    <div
      onClick={onTap}
      className="bg-slate-800 rounded-lg p-4 shadow-md border border-slate-700 active:bg-slate-700 transition-colors cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate">{project.name}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{project.responsible}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Deadline */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">Дедлайн</span>
        <span className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
          {formatDate(project.deadline)}
        </span>
      </div>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded bg-slate-700 text-slate-300">
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded bg-slate-700 text-slate-400">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          {hasAttachments ? (
            <>
              {fileCount > 0 && (
                <div className="flex items-center space-x-1 text-slate-400">
                  <FileIcon className="w-4 h-4" />
                  <span className="text-xs">{fileCount}</span>
                </div>
              )}
              {linkCount > 0 && (
                <div className="flex items-center space-x-1 text-slate-400">
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-xs">{linkCount}</span>
                </div>
              )}
            </>
          ) : (
            <span className="text-xs text-red-400">Нет вложений</span>
          )}
        </div>
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default ProjectCard;
